# Signed URL Cache Layer - Architecture Plan

## Problem Analysis

### Current Implementation

The attachment resolution system works as follows:

1. **Client-side** ([`use-attachment-url.ts`](src/hooks/use-attachment-url.ts:79-88)): React Query provides client-side caching with a 23-hour stale time
2. **Server-side** ([`file-storage-service.ts`](src/lib/storage/file-storage-service.ts:69-97)): Every call to `resolveAttachmentUrl()` creates a **new signed URL** via Supabase

### The Issue

While React Query provides client-side caching, it only works within a single browser session. The following scenarios still hit Supabase every time:

- Page refresh (client-side cache is lost)
- User revisits the page later
- Multiple API calls across different server instances
- Server-side rendering scenarios

This creates unnecessary load on Supabase and generates new signed URLs frequently.

---

## Proposed Solution Evaluation

### Your Proposal (Validated ✅)

Your idea is **sound** and addresses the real problem. Here's my analysis:

| Aspect | Your Proposal | Verdict |
|--------|----------------|---------|
| DB-level caching | Store signed URLs in PostgreSQL | ✅ Correct approach |
| Cache table structure | `file_path, signed_url, expires_at` | ⚠️ Needs adjustment |
| Daily cleanup cron | UTC 00:00 | ✅ Good strategy |

---

## Recommended Implementation

### 1. Database Schema (Enhanced)

The cache table should use `file_id` (UUID) as the primary key, not `file_path`. Here's the recommended schema:

```sql
-- ============================================================================
-- SIGNED URL CACHE TABLE
-- Caches signed URLs to reduce Supabase bucket API calls
-- Version: 009
-- Created: 2025-03-11
-- ============================================================================

-- 1. CREATE SIGNED_URL_CACHE TABLE
CREATE TABLE IF NOT EXISTS public.signed_url_cache (
  -- Link to file_uploads table (CASCADE delete on hard delete)
  file_id UUID PRIMARY KEY REFERENCES public.file_uploads(id) ON DELETE CASCADE,
  
  -- The cached signed URL
  signed_url TEXT NOT NULL,
  
  -- When the signed URL expires (should match Supabase's 24h expiry)
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Track when we cached it (for debugging/cleanup)
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. CREATE INDEXES FOR PERFORMANCE
-- Efficient expiration cleanup queries
CREATE INDEX IF NOT EXISTS idx_signed_url_cache_expires_at 
  ON public.signed_url_cache(expires_at);

-- 3. DISABLE ROW LEVEL SECURITY
ALTER TABLE public.signed_url_cache DISABLE ROW LEVEL SECURITY;

-- 4. CREATE TRIGGER FOR SOFT DELETE CASCADE
-- When a file is soft-deleted (deleted_at set), also remove cached URL
DROP TRIGGER IF EXISTS delete_signed_url_cache_on_soft_delete ON public.file_uploads;
CREATE TRIGGER delete_signed_url_cache_on_soft_delete
  AFTER UPDATE OF deleted_at ON public.file_uploads
  FOR EACH ROW
  WHEN (NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL)
  EXECUTE FUNCTION delete_signed_url_for_file();

-- 5. CREATE HELPER FUNCTION FOR SOFT DELETE CASCADE
CREATE OR REPLACE FUNCTION delete_signed_url_for_file() RETURNS TRIGGER AS $
BEGIN
  DELETE FROM public.signed_url_cache WHERE file_id = NEW.id;
  RETURN NEW;
END;
$ LANGUAGE plpgsql;
```

**Why `file_id` instead of `file_path`?**
- The current API uses `fileId` (UUID) to resolve URLs
- Direct lookup by ID is faster and ensures one-to-one mapping
- CASCADE delete keeps cache in sync when files are deleted

---

### 2. Cache Logic (Modified `resolveAttachmentUrl`)

```typescript
// New function to get cached URL
async function getCachedSignedUrl(fileId: string): Promise<string | null> {
  const supabase = getSupabaseAdminClient();
  
  const { data, error } = await supabase
    .from('signed_url_cache')
    .select('signed_url, expires_at')
    .eq('file_id', fileId)
    .single();
  
  if (error || !data) return null;
  
  // Check if cached URL is still valid
  if (new Date(data.expires_at) > new Date()) {
    return data.signed_url;
  }
  
  return null; // Expired
}

// New function to cache URL
async function cacheSignedUrl(fileId: string, signedUrl: string, expiresInSeconds: number): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
  
  await supabase
    .from('signed_url_cache')
    .upsert({
      file_id: fileId,
      signed_url: signedUrl,
      expires_at: expiresAt.toISOString(),
      cached_at: new Date().toISOString()
    }, { onConflict: 'file_id' });
}

// Modified resolveAttachmentUrl
export async function resolveAttachmentUrl(
  fileId: string,
  requestingUserId: string
): Promise<string> {
  const supabase = getSupabaseAdminClient();
  
  // 1. Fetch file metadata with ownership check
  const { data: file, error } = await supabase
    .from('file_uploads')
    .select('*')
    .eq('id', fileId)
    .eq('user_id', requestingUserId)
    .single();
  
  if (error || !file) {
    throw new Error('File not found or access denied');
  }
  
  if (file.deleted_at) {
    throw new Error('File has been deleted');
  }
  
  // 2. Try to get cached URL first
  const cachedUrl = await getCachedSignedUrl(fileId);
  if (cachedUrl) {
    return cachedUrl;
  }
  
  // 3. Create new signed URL if not cached
  const signedUrl = await createSignedUrl(file.storage_path);
  
  // 4. Cache the new URL
  await cacheSignedUrl(fileId, signedUrl, URL_EXPIRY_SECONDS);
  
  return signedUrl;
}
```

---

### 3. Daily Cleanup Cron Job

Since this project doesn't have cron infrastructure yet, here are the options:

-- 6. SET UP DAILY CLEANUP CRON JOB (pg_cron)
-- Enable pg_cron extension (requires superuser access)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant permissions
GRANT USAGE ON SCHEMA cron TO supabase_admin;

-- Schedule daily cleanup at UTC 00:00
SELECT cron.schedule(
  'cleanup-expired-signed-urls',
  '0 0 * * *',  -- Daily at midnight UTC
  $DELETE FROM public.signed_url_cache WHERE expires_at < NOW()$
);

#### Option B: Vercel Cron (If deployed on Vercel)

---

### 4. Important Edge Cases

| Edge Case | Handling |
|-----------|----------|
| File **hard deleted** from `file_uploads` | CASCADE delete on `file_id` foreign key removes cache automatically |
| File **soft deleted** (`deleted_at` set) | PostgreSQL trigger `delete_signed_url_cache_on_soft_delete` removes cache |
| Signed URL expires in cache but not in Supabase | Expired URLs are ignored; new one is generated on next request |
| Race condition (two requests simultaneously) | Use `upsert` to handle concurrent writes safely |
| User doesn't own the file | Already checked via `user_id` filter in query |
| Cache table grows large | Daily cleanup + TTL index keeps it small |

---

## Implementation Roadmap

1. **Create database migration** (`009_signed_url_cache.sql`)
   - Create `signed_url_cache` table
   - Add foreign key to `file_uploads` with CASCADE delete
   - Add index on `expires_at`
   - Create trigger for soft delete cascade
   - Set up pg_cron job for daily cleanup

2. **Update `file-storage-service.ts` ([`src/lib/storage/file-storage-service.ts`](src/lib/storage/file-storage-service.ts))
   - Add `getCachedSignedUrl()` function
   - Add `cacheSignedUrl()` function
   - Modify `resolveAttachmentUrl()` to use cache-first logic

3. **Testing considerations**
   - Verify cache hit/miss behavior
   - Test cleanup job removes expired entries
   - Test soft delete cascades to cache
   - Test hard delete cascades to cache

---

## Recommendation

**Your idea is valid and should be implemented.** The DB-level cache will significantly reduce Supabase bucket API calls, especially for:

- Frequently accessed files (e.g., images in chat history)
- Pages that load multiple attachments
- Server-side rendering scenarios

### Final Architecture

| Component | Technology |
|-----------|------------|
| Cache storage | PostgreSQL `signed_url_cache` table |
| Cache lookup | `file_id` (UUID) primary key |
| Cache invalidation | CASCADE on hard delete + Trigger on soft delete |
| Cleanup job | Supabase pg_cron (daily at UTC 00:00) |

### Prerequisites

1. **Supabase superuser access** - Required to enable `pg_cron` extension
2. **Migration file** - Create `database/migrations/009_signed_url_cache.sql`

The implementation is straightforward and follows existing patterns in your codebase. The plan is ready for implementation in Code mode.

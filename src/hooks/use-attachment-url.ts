"use client";

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

const ATTACHMENT_URL_PREFIX = 'attachment://';

/**
 * Checks if a URL is an attachment URL (custom URL scheme)
 */
export function isAttachmentUrl(url: string): boolean {
  return url.startsWith(ATTACHMENT_URL_PREFIX);
}

/**
 * Extracts the file ID from an attachment URL
 * Format: attachment://{fileId}
 */
export function extractFileIdFromAttachmentUrl(url: string): string {
  if (!isAttachmentUrl(url)) {
    throw new Error('Invalid attachment URL');
  }
  return url.slice(ATTACHMENT_URL_PREFIX.length);
}

/**
 * Fetcher function for resolving attachment URLs
 */
async function resolveAttachmentFetcher(fileId: string): Promise<string> {
  const response = await fetch('/api/attachments/resolve', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fileId }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to resolve attachment URL');
  }

  const data = await response.json();
  return data.url;
}

interface UseAttachmentUrlResult {
  resolvedUrl: string | undefined;
  isResolving: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Custom hook to resolve attachment URLs to signed URLs using React Query.
 * This provides automatic caching, deduplication, and retry logic.
 * 
 * Benefits over manual fetch:
 * - Caching: Same attachment URL won't trigger duplicate requests
 * - Deduplication: Multiple components requesting same URL = single request
 * - Retry: Automatic retry on failure (3 attempts by default)
 * - Stale-while-revalidate: Shows cached data while refreshing in background
 */
export function useAttachmentUrl(initialUrl: string | undefined): UseAttachmentUrlResult {
  // Determine if this is an attachment URL that needs resolution
  const isAttachment = useMemo(() => {
    return initialUrl !== undefined && isAttachmentUrl(initialUrl);
  }, [initialUrl]);

  const fileId = useMemo((): string | null => {
    if (!isAttachment || !initialUrl) return null;
    try {
      return extractFileIdFromAttachmentUrl(initialUrl);
    } catch {
      return null;
    }
  }, [initialUrl, isAttachment]);

  // Use React Query for data fetching with caching
  const queryResult = useQuery({
    queryKey: ['attachment-url', fileId],
    queryFn: () => resolveAttachmentFetcher(fileId!),
    enabled: !!fileId, // Only run query if we have a valid fileId
    staleTime: 23 * 60 * 60 * 1000, // 23 hours - signed URLs expire in 24 hours
    gcTime: 24 * 60 * 60 * 1000, // 24 hours garbage collection (formerly cacheTime)
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Return the resolved URL or original based on URL type
  return {
    resolvedUrl: isAttachment ? queryResult.data : initialUrl,
    isResolving: queryResult.isLoading,
    error: queryResult.error as Error | null,
    refetch: queryResult.refetch,
  };
}

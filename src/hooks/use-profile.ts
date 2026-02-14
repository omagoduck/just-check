import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOnboardedAuth } from './use-onboarded-auth';
import { Profile, UpdateProfileRequest } from '@/types/profile';

/**
 * Profile Management Hooks
 * Provides React Query hooks for fetching and updating user profiles.
 * Uses the /api/profile endpoint which syncs with both Supabase and Clerk.
 */

/**
 * Fetches the current user's profile from the API
 * Uses credentials: 'include' to send cookies for authentication
 * Returns null if user is not authenticated (401) or no profile exists
 */
async function fetchProfile(): Promise<Profile | null> {
  const response = await fetch('/api/profile', {
    credentials: 'include' // Include cookies for session authentication
  });

  if (!response.ok) {
    // 401 means user is not authenticated - return null instead of throwing
    if (response.status === 401) {
      return null;
    }
    throw new Error('Failed to fetch profile');
  }

  const data = await response.json();
  return data.profile;
}

/**
 * Sends profile updates to the API
 * @param updates - Partial profile data to update (only provided fields are updated)
 * @returns The updated profile from the server
 * @throws Error if the update fails
 */
async function updateProfileAPI(updates: UpdateProfileRequest): Promise<Profile> {
  const response = await fetch('/api/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Include cookies for session authentication
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    // Try to extract error message from response, fallback to generic message
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update profile');
  }

  const data = await response.json();
  return data.profile;
}

// For now clerk is used for profile picture storage and kinda okay
// TODO P5: Remove clerk dependency and use Supabase for profile picture storage

/**
 * Uploads a profile picture to Clerk via the API
 * @param file - The image file to upload
 * @returns The uploaded image URL from Clerk
 * @throws Error if the upload fails
 */
async function uploadAvatarAPI(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/profile/avatar', {
    method: 'POST',
    credentials: 'include',
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to upload avatar');
  }

  const data = await response.json();
  return data.imageUrl;
}

/**
 * Hook for fetching the current user's profile
 * Uses React Query for caching and automatic refetching
 * Only runs when user is signed in and has completed onboarding
 *
 * @returns Query result with profile data, loading states, and error info
 */
export function useProfile() {
  const { isSignedInAndOnboarded } = useOnboardedAuth();

  return useQuery({
    queryKey: ['profile'], // Cache key for profile data
    queryFn: fetchProfile,
    enabled: isSignedInAndOnboarded, // Only fetch if user is signed in and onboarded
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes (5 * 60 * 1000 ms)
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnReconnect: false, // Don't refetch on network reconnect
  });
}

/**
 * Hook for updating the current user's profile
 * Implements optimistic updates - updates UI immediately, then syncs with server
 * Rolls back changes if the update fails
 *
 * @returns Mutation object with mutateAsync function and loading states
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfileAPI,
    /**
     * onMutate: Runs before the mutation starts
     * Implements optimistic update by immediately updating the cached profile
     * Stores the previous profile for rollback if the mutation fails
     */
    onMutate: async (updates) => {
      // Cancel any ongoing profile queries to avoid conflicts
      await queryClient.cancelQueries({ queryKey: ['profile'] });

      // Snapshot the previous profile value for rollback
      const previousProfile = queryClient.getQueryData<Profile | null>(['profile']);

      // Optimistically update the profile in the cache
      queryClient.setQueryData<Profile | null>(['profile'], (old) => {
        if (!old) return null;
        // Merge updates with existing profile, set updated_at to current time
        return { ...old, ...updates, updated_at: new Date().toISOString() };
      });

      // Return context with the previous profile for error handling
      return { previousProfile };
    },
    /**
     * onError: Runs if the mutation fails
     * Rolls back to the previous profile data
     */
    onError: (error, variables, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(['profile'], context.previousProfile);
      }
    },
    /**
     * onSettled: Runs after mutation completes (success or error)
     * Invalidates the profile query to ensure fresh data from server
     */
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  });
}

/**
 * Simple hook that returns just the profile data (without query metadata)
 * Useful when you only need the profile value and not loading/error states
 *
 * @returns The profile data or null if not available
 */
export function useProfileValue() {
  const { data } = useProfile();
  return data;
}

// For now clerk is used for profile picture storage and kinda okay
// TODO P5: Remove clerk dependency and use Supabase for profile picture storage

/**
 * Hook for uploading the user's avatar/profile picture
 * Uploads the file to Clerk, which handles storage internally
 * After upload, the webhook will sync the avatar URL to Supabase
 *
 * @returns Mutation object with mutateAsync function and loading states
 */
export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadAvatarAPI,
    onSuccess: () => {
      // Invalidate profile to trigger refetch with new avatar
      // This will get the updated avatar from Clerk via the webhook sync
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

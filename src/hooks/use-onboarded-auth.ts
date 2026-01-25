import { useAuth } from '@clerk/nextjs';
import { useUser } from '@clerk/nextjs';

export function useOnboardedAuth() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  // Check if user is onboarded using public metadata
  const isOnboarded = !!user?.publicMetadata?.profileComplete;

  // Combined state: user must be both signed in and onboarded
  const isSignedInAndOnboarded = isSignedIn && isOnboarded;

  return {
    isOnboarded,
    isSignedInAndOnboarded
  };
}

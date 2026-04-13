import { useAuth } from '@clerk/nextjs';
import { useUser } from '@clerk/nextjs';

export function useOnboardedAuth() {
  const auth = useAuth();
  const { user } = useUser();

  const isOnboarded = !!user?.publicMetadata?.profileComplete;
  const isSignedInAndOnboarded = auth.isSignedIn && isOnboarded;

  return {
    ...auth,
    isOnboarded,
    isSignedInAndOnboarded
  };
}

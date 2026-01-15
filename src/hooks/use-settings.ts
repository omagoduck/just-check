import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserSettings, DEFAULT_USER_SETTINGS } from '@/types/settings';

async function fetchSettings(): Promise<UserSettings> {
  const response = await fetch('/api/settings', {
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch settings');
  }

  const data = await response.json();
  return data.settings;
}

async function updateSettingsAPI(settings: Partial<UserSettings>): Promise<UserSettings> {
  const response = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ settings })
  });

  if (!response.ok) {
    throw new Error('Failed to update settings');
  }

  const data = await response.json();
  return data.settings;
}

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSettingsAPI,
    onMutate: async (newSettings) => {
      await queryClient.cancelQueries({ queryKey: ['settings'] });

      const previousSettings = queryClient.getQueryData<UserSettings>(['settings']);

      queryClient.setQueryData(['settings'], (old: UserSettings | undefined) => {
        if (!old) return { ...DEFAULT_USER_SETTINGS, ...newSettings };
        return { ...old, ...newSettings };
      });

      return { previousSettings };
    },
    onError: (error, variables, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(['settings'], context.previousSettings);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    }
  });
}

export function useSettingsValue() {
  const { data } = useSettings();
  return data || DEFAULT_USER_SETTINGS;
}

"use client";

import { useSettings } from '@/hooks/use-settings';
import { useEffect } from 'react';
import { toast } from 'sonner';

// Loading the settings at app initial load is super necessary
export function SettingsLoader({ children }: { children: React.ReactNode }) {
  const { isLoading, isError, error } = useSettings();

  // TODO: The toast is too simple. Make the toast more colorful (like destructive). 
  // If we can't figure out the way to do it, we can use a modal instead for fallback or consider a new toast library.
  useEffect(() => {
    if (isError) {
      toast.error('Settings failed to load', {
        description: (
          <span>
            Please refresh the page. If this persists,{' '}
            <a href="/feedback" className="underline hover:text-foreground/80">
              please provide feedback
            </a>
            .
          </span>
        ),
        action: {
          label: 'Refresh',
          onClick: () => window.location.reload()
        },
        duration: 8000,
      });
    }
  }, [isError, error]);

  return <>{children}</>;
}
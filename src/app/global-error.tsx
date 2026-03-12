'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-10 w-10 text-destructive" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">
                Application Error
              </h1>
              <p className="text-muted-foreground">
                A critical error occurred. Please refresh the page to continue.
              </p>
            </div>

            {error.digest && (
              <p className="text-xs text-muted-foreground/60">
                Error ID: {error.digest}
              </p>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                onClick={reset}
                variant="default"
                size="lg"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh page
              </Button>
              <Button
                onClick={() => (window.location.href = '/')}
                variant="outline"
                size="lg"
              >
                Go to homepage
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}

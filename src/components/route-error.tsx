'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface RouteErrorConfig {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  primaryAction: {
    label: string
    href?: string
    onClick?: () => void
  }
  secondaryAction?: {
    label: string
    href?: string
    onClick?: () => void
  }
  className?: string
}

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export function createRouteError(config: RouteErrorConfig) {
  return function RouteError({ error, reset }: ErrorProps) {
    React.useEffect(() => {
      console.error(`${config.title} error:`, error)
    }, [error])

    const handlePrimaryAction = () => {
      if (config.primaryAction.onClick) {
        config.primaryAction.onClick()
      } else if (config.primaryAction.href) {
        // Navigation will be handled by Link component
      } else {
        reset()
      }
    }

    const handleSecondaryAction = () => {
      if (config.secondaryAction?.onClick) {
        config.secondaryAction.onClick()
      } else if (config.secondaryAction?.href) {
        // Navigation will be handled by Link component
      }
    }

    const Icon = config.icon

    return (
      <div className={cn('flex flex-1 flex-col items-center justify-center p-8', config.className)}>
        <div className="w-full max-w-lg space-y-6 text-center">
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
              <Icon className="h-10 w-10 text-destructive" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              {config.title}
            </h2>
            <p className="text-muted-foreground">
              {config.description}
            </p>
          </div>

          {error.digest && (
            <p className="text-xs text-muted-foreground/60">
              Error ID: {error.digest}
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            {config.primaryAction.href ? (
              <Button asChild variant="default" size="lg" className="gap-2">
                <Link href={config.primaryAction.href}>
                  <RefreshCw className="h-4 w-4" />
                  {config.primaryAction.label}
                </Link>
              </Button>
            ) : (
              <Button
                onClick={handlePrimaryAction}
                variant="default"
                size="lg"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                {config.primaryAction.label}
              </Button>
            )}

            {config.secondaryAction && (
              config.secondaryAction.href ? (
                <Button asChild variant="outline" size="lg" className="gap-2">
                  <Link href={config.secondaryAction.href}>
                    {config.secondaryAction.label}
                  </Link>
                </Button>
              ) : (
                <Button
                  onClick={handleSecondaryAction}
                  variant="outline"
                  size="lg"
                  className="gap-2"
                >
                  {config.secondaryAction.label}
                </Button>
              )
            )}
          </div>
        </div>
      </div>
    )
  }
}

// Pre-configured error components for common routes
export const MainLayoutError = createRouteError({
  title: 'Chat Error',
  description: 'Something went wrong with the chat interface. This might be a temporary issue.',
  icon: AlertCircle,
  primaryAction: {
    label: 'Try again',
  },
  secondaryAction: {
    label: 'New chat',
    href: '/',
  },
})

export const AuthError = createRouteError({
  title: 'Authentication Error',
  description: 'There was a problem with the authentication process. Please try again.',
  icon: AlertCircle,
  primaryAction: {
    label: 'Try again',
  },
  secondaryAction: {
    label: 'Sign in',
    href: '/sign-in',
  },
})

export const SettingsError = createRouteError({
  title: 'Settings Error',
  description: 'Unable to load settings. This might be due to a network issue or temporary service problem.',
  icon: AlertCircle,
  primaryAction: {
    label: 'Try again',
  },
  secondaryAction: {
    label: 'Back to settings',
    href: '/settings',
  },
})

export const CheckoutError = createRouteError({
  title: 'Checkout Error',
  description: 'There was a problem processing your payment. Please try again or contact support if the issue persists.',
  icon: AlertCircle,
  primaryAction: {
    label: 'Try again',
  },
  secondaryAction: {
    label: 'Back to plans',
    href: '/upgrade',
  },
})

export const UpgradeError = createRouteError({
  title: 'Pricing Error',
  description: 'Unable to load pricing plans. This might be due to a network issue or temporary service problem.',
  icon: AlertCircle,
  primaryAction: {
    label: 'Try again',
  },
  secondaryAction: {
    label: 'Back to home',
    href: '/',
  },
})

export const RootError = createRouteError({
  title: 'Something went wrong',
  description: 'An unexpected error occurred while loading this page.',
  icon: AlertCircle,
  primaryAction: {
    label: 'Try again',
  },
  secondaryAction: {
    label: 'Go home',
    href: '/',
  },
  className: 'min-h-[60vh]',
})
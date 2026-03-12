'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  className?: string
  onReset?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div
          className={cn(
            'flex min-h-[400px] w-full flex-col items-center justify-center rounded-lg border border-border bg-card p-8 text-center',
            this.props.className
          )}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-6">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold text-card-foreground mb-2">
            Something went wrong
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            An unexpected error occurred. Please try again.
          </p>
          <Button
            onClick={this.handleReset}
            variant="default"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}

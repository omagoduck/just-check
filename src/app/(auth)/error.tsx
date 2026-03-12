'use client'

import { AuthError } from '@/components/route-error'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <AuthError error={error} reset={reset} />
}

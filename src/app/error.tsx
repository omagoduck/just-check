'use client'

import { RootError } from '@/components/route-error'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <RootError error={error} reset={reset} />
}

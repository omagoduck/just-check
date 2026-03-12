'use client'

import { MainLayoutError } from '@/components/route-error'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <MainLayoutError error={error} reset={reset} />
}

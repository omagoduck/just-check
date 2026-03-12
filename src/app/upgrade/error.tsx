'use client'

import { UpgradeError } from '@/components/route-error'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <UpgradeError error={error} reset={reset} />
}

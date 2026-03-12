'use client'

import { SettingsError } from '@/components/route-error'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <SettingsError error={error} reset={reset} />
}

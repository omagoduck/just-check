import type { Metadata } from 'next';
import UsagePageClient from './page-client';

export const metadata: Metadata = {
  title: 'Usage - Lumy',
};

export default function UsagePage() {
  return <UsagePageClient />;
}

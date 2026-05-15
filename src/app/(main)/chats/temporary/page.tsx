import type { Metadata } from 'next';
import TemporaryChatPageClient from './page-client';

export const metadata: Metadata = {
  title: 'Temporary Chat - Lumy',
};

export default function TemporaryChatPage() {
  return <TemporaryChatPageClient />;
}

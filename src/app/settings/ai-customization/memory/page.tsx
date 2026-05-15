import type { Metadata } from 'next';
import MemorySettingsPageClient from './page-client';

export const metadata: Metadata = {
  title: 'AI Memory - Lumy',
};

export default function MemorySettingsPage() {
  return <MemorySettingsPageClient />;
}

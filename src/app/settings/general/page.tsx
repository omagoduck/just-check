import type { Metadata } from 'next';
import GeneralSettingsPageClient from './page-client';

export const metadata: Metadata = {
  title: 'General - Lumy',
};

export default function GeneralSettingsPage() {
  return <GeneralSettingsPageClient />;
}

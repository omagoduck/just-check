import type { Metadata } from 'next';
import DataControlSettingsPageClient from './page-client';

export const metadata: Metadata = {
  title: 'Data Control - Lumy',
};

export default function DataControlSettingsPage() {
  return <DataControlSettingsPageClient />;
}

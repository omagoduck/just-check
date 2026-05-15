import type { Metadata } from 'next';
import PrivacySettingsPageClient from './page-client';

export const metadata: Metadata = {
  title: 'Privacy - Lumy',
};

export default function PrivacySettingsPage() {
  return <PrivacySettingsPageClient />;
}

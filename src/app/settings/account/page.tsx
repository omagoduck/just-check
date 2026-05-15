import type { Metadata } from 'next';
import AccountSettingsPageClient from './page-client';

export const metadata: Metadata = {
  title: 'Account - Lumy',
};

export default function AccountSettingsPage() {
  return <AccountSettingsPageClient />;
}

import type { Metadata } from 'next';
import AICustomizationSettingsPageClient from './page-client';

export const metadata: Metadata = {
  title: 'AI Customization - Lumy',
};

export default function AICustomizationSettingsPage() {
  return <AICustomizationSettingsPageClient />;
}

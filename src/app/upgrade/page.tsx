import type { Metadata } from 'next';
import UpgradePageClient from './page-client';

export const metadata: Metadata = {
  title: 'Plans & Pricing - Lumy',
  description:
    'Find the Lumy plan that fits the way you think. From free exploration to full creative power - upgrade and unlock more of what makes Lumy yours.',
};

export default function UpgradePage() {
  return <UpgradePageClient />;
}

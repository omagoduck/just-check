import type { Metadata } from 'next';
import OnboardingPageClient from './page-client';

export const metadata: Metadata = {
  title: 'Get Started - Lumy',
};

export default function OnboardingPage() {
  return <OnboardingPageClient />;
}

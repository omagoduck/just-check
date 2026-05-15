import type { Metadata } from 'next';
import LandingPageClient from './page-client';

export const metadata: Metadata = {
  title: 'Lumy - Light up your ideas',
  description:
    'The smart AI workspace that keeps up with your thinking. Simple enough to start, powerful enough to stay.',
};

export default function LandingPage() {
  return <LandingPageClient />;
}

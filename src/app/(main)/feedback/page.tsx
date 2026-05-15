import type { Metadata } from 'next';
import FeedbackPageClient from './page-client';

export const metadata: Metadata = {
  title: 'Share Feedback - Lumy',
};

export default function FeedbackPage() {
  return <FeedbackPageClient />;
}

import type { Metadata } from 'next';
import StudentsPageClient from './page-client';

export const metadata: Metadata = {
  title: 'Lumy for Students',
  description:
    'The study partner that never sleeps. Break down complex topics, revise from your own notes, and stay organized - from first confusion to final draft.',
};

export default function StudentsPage() {
  return <StudentsPageClient />;
}

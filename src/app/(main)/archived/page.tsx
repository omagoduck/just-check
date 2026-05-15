import type { Metadata } from 'next';
import ArchivedPageClient from './page-client';

export const metadata: Metadata = {
  title: 'Archived Chats - Lumy',
};

export default function ArchivedPage() {
  return <ArchivedPageClient />;
}

import type { Metadata } from 'next';
import FoldersPageClient from './page-client';

export const metadata: Metadata = {
  title: 'Folders - Lumy',
};

export default function FoldersPage() {
  return <FoldersPageClient />;
}

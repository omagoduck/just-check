import type { Metadata } from 'next';
import FolderDetailPageClient from './page-client';

export const metadata: Metadata = {
  title: 'Folder - Lumy',
};

export default function FolderDetailPage() {
  return <FolderDetailPageClient />;
}

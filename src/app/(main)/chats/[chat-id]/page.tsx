import type { Metadata } from 'next';
import ChatPageClient from './page-client';

export const metadata: Metadata = {
  title: 'Chat - Lumy',
};

export default function ChatPage() {
  return <ChatPageClient />;
}

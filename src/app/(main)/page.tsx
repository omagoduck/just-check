import type { Metadata } from 'next';
import MainClient from './page-client';

export const metadata: Metadata = {
  title: 'New Chat - Lumy',
};

export default function Main() {
  return <MainClient />;
}

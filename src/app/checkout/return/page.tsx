import type { Metadata } from 'next';
import CheckoutReturnPageClient from './page-client';

export const metadata: Metadata = {
  title: 'Payment Confirmation - Lumy',
};

export default function CheckoutReturnPage() {
  return <CheckoutReturnPageClient />;
}

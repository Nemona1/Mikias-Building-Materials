// app/manager/customers/page.jsx
'use client';

import dynamic from 'next/dynamic';

// Dynamically import the shared component with no SSR
const CustomerList = dynamic(
  () => import('@/components/customers/CustomerList'),
  { ssr: false }
);

export default function ManagerCustomersPage() {
  return <CustomerList role="manager" />;
}
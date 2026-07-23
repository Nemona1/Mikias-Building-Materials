// app/staff/customers/page.jsx
'use client';

import dynamic from 'next/dynamic';

// Dynamically import the shared component with no SSR
const CustomerList = dynamic(
  () => import('@/components/customers/CustomerList'),
  { ssr: false }
);

export default function StaffCustomersPage() {
  return <CustomerList role="staff" />;
}
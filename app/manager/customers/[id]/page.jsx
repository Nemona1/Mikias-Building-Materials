// app/manager/customers/[id]/page.jsx
'use client';

import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import the detail component with default export
const CustomerDetailView = dynamic(
  () => import('@/components/customers/CustomerDetailView'),
  { ssr: false }
);

export default function ManagerCustomerDetailPage() {
  const params = useParams();
  const customerId = params?.id;
  
  return <CustomerDetailView customerId={customerId} role="manager" />;
}
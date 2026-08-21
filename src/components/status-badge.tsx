'use client';

import { Badge } from '@/components/ui/badge';

const statusStyles: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100',
  PROCESSING: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  COMPLETED: 'bg-green-100 text-green-700 hover:bg-green-100',
  FAILED: 'bg-red-100 text-red-700 hover:bg-red-100',
  CANCELLED: 'bg-gray-100 text-gray-600 hover:bg-gray-100',
  PARTIAL: 'bg-orange-100 text-orange-700 hover:bg-orange-100',
  REFUNDED: 'bg-purple-100 text-purple-700 hover:bg-purple-100',
  OPEN: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  ANSWERED: 'bg-green-100 text-green-700 hover:bg-green-100',
  CLOSED: 'bg-gray-100 text-gray-600 hover:bg-gray-100',
  APPROVED: 'bg-green-100 text-green-700 hover:bg-green-100',
  REJECTED: 'bg-red-100 text-red-700 hover:bg-red-100',
  DEPOSIT: 'bg-green-100 text-green-700 hover:bg-green-100',
  ORDER_PAYMENT: 'bg-red-100 text-red-700 hover:bg-red-100',
  REFUND: 'bg-purple-100 text-purple-700 hover:bg-purple-100',
  ADMIN_ADJUSTMENT: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  ACTIVE: 'bg-green-100 text-green-700 hover:bg-green-100',
  INACTIVE: 'bg-red-100 text-red-700 hover:bg-red-100',
  SUSPENDED: 'bg-red-100 text-red-700 hover:bg-red-100',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="secondary" className={statusStyles[status] || 'bg-gray-100 text-gray-600'}>
      {status}
    </Badge>
  );
}

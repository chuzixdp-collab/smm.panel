'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/status-badge';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/orders/${id}`).then(r => r.json()).then(json => {
      if (json.success) setOrder(json.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" /></div>;
  if (!order) return <div className="py-12 text-center text-slate-500">Order not found</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/dashboard/orders"><Button variant="ghost" size="sm"><ArrowLeft className="mr-1 h-4 w-4" /> Back</Button></Link>
      </div>

      <Card className="border-slate-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>Order #{order.id.slice(0, 8)}</CardTitle>
            <StatusBadge status={order.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[{ label: 'Service', value: order.service?.name || '—' }, { label: 'Platform', value: order.service?.platform || '—' }, { label: 'Quantity', value: order.quantity.toLocaleString() }, { label: 'Charge', value: formatCurrency(order.charge), bold: true }, { label: 'Start Count', value: String(order.startCount || 0) }, { label: 'Remains', value: String(order.remains || 0) }, { label: 'Created', value: formatDateTime(order.createdAt) }, { label: 'Updated', value: formatDateTime(order.updatedAt) }].map(item => (
              <div key={item.label}>
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className={`text-sm mt-0.5 ${item.bold ? 'font-bold text-indigo-600' : 'text-slate-900'}`}>{item.value}</p>
              </div>
            ))}
          </div>
          <div>
            <p className="text-xs text-slate-500">Target URL</p>
            <p className="text-sm text-indigo-600 break-all mt-0.5">{order.targetUrl}</p>
          </div>
          {order.providerOrderId && (
            <div>
              <p className="text-xs text-slate-500">Provider Order ID</p>
              <p className="text-sm text-slate-900 font-mono mt-0.5">{order.providerOrderId}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
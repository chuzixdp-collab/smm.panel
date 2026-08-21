'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  Copy,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/status-badge';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

interface OrderDetail {
  id: string;
  targetUrl: string;
  quantity: number;
  charge: number;
  startCount: number;
  remains: number;
  status: string;
  providerOrderId: string | null;
  refundAmount: number;
  createdAt: string;
  updatedAt: string;
  service: {
    id: string;
    name: string;
    platform: string;
    category: string;
    price: number;
  } | null;
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <Card className="border-slate-200">
        <CardContent className="p-6 space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-48" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (res.ok) {
        const json = await res.json();
        setOrder(json.data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (res.ok) {
        const json = await res.json();
        setOrder(json.data);
        toast.success('Status updated');
      } else {
        toast.error('Failed to refresh status');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setRefreshing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (loading) return <DetailSkeleton />;

  if (notFound || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-full bg-red-50 p-6">
          <AlertTriangle className="h-10 w-10 text-red-400" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-slate-900">Order Not Found</h2>
        <p className="mt-2 text-sm text-slate-500">
          The order you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push('/dashboard/orders')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>
      </div>
    );
  }

  const canRefresh = order.status === 'PENDING' || order.status === 'PROCESSING';

  const detailRows = [
    { label: 'Order ID', value: order.id, mono: true, copyable: true },
    { label: 'Provider Order ID', value: order.providerOrderId || '—', mono: true },
    { label: 'Service', value: order.service?.name || '—' },
    { label: 'Platform', value: order.service?.platform || '—' },
    { label: 'Category', value: order.service?.category || '—' },
    {
      label: 'Target URL',
      value: order.targetUrl,
      isLink: true,
      copyable: true,
    },
    { label: 'Quantity', value: order.quantity.toLocaleString(), numeric: true },
    { label: 'Charge', value: formatCurrency(order.charge), numeric: true },
    { label: 'Start Count', value: order.startCount.toLocaleString(), numeric: true },
    { label: 'Remains', value: order.remains.toLocaleString(), numeric: true },
    { label: 'Refund Amount', value: formatCurrency(order.refundAmount), numeric: true },
    { label: 'Created', value: formatDateTime(order.createdAt) },
    { label: 'Updated', value: formatDateTime(order.updatedAt) },
  ];

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => router.push('/dashboard/orders')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Order Details</h1>
            <p className="text-sm text-slate-500 font-mono">#{order.id.slice(0, 12)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh Status'}
            </Button>
          )}
        </div>
      </div>

      {/* Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' as const }}
      >
        <Card className="border-slate-200">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <p className="text-sm text-slate-500">Status</p>
                <div className="mt-1">
                  <StatusBadge status={order.status} />
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Total Charge</p>
                <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
                  {formatCurrency(order.charge)}
                </p>
              </div>
            </div>
            <Separator className="mb-6" />
            <div className="space-y-4">
              {detailRows.map((row) => (
                <div
                  key={row.label}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4"
                >
                  <span className="text-sm text-slate-500 flex-shrink-0">{row.label}</span>
                  <span
                    className={`${
                      row.mono
                        ? 'font-mono text-xs'
                        : row.numeric
                        ? 'text-sm font-medium text-slate-900 tabular-nums'
                        : 'text-sm text-slate-900'
                    } text-right break-all sm:break-normal`}
                  >
                    {row.isLink ? (
                      <a
                        href={row.value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline inline-flex items-center gap-1 max-w-full"
                      >
                        <span className="truncate max-w-[300px]">{row.value}</span>
                        <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                      </a>
                    ) : (
                      row.value
                    )}
                    {row.copyable && (
                      <button
                        onClick={() => copyToClipboard(row.value)}
                        className="ml-2 text-slate-400 hover:text-slate-600 transition-colors"
                        title="Copy"
                      >
                        <Copy className="h-3.5 w-3.5 inline" />
                      </button>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

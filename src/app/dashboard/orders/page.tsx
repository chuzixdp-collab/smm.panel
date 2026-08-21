'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, ClipboardList, ExternalLink, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { StatusBadge } from '@/components/status-badge';
import { formatCurrency, truncate, timeAgo } from '@/lib/utils';

interface Order {
  id: string;
  targetUrl: string;
  quantity: number;
  charge: number;
  startCount: number;
  remains: number;
  status: string;
  createdAt: string;
  service: {
    id: string;
    name: string;
    platform: string;
    category: string;
  } | null;
}

const STATUS_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Processing', value: 'PROCESSING' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Partial', value: 'PARTIAL' },
  { label: 'Cancelled', value: 'CANCELLED' },
  { label: 'Failed', value: 'FAILED' },
];

const DATE_OPTIONS = [
  { label: 'All Time', value: '' },
  { label: 'Last 24 Hours', value: '24h' },
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
];

const PER_PAGE = 20;

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [dateRange, setDateRange] = useState('');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PER_PAGE),
      });
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);

      const res = await fetch(`/api/orders?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        const data = json.data;
        setOrders(data?.orders || []);
        setTotal(data?.total || 0);
        setTotalPages(data?.totalPages || 1);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, search, dateRange]);

  const handleRowClick = (orderId: string) => {
    router.push(`/dashboard/order/${orderId}`);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('ellipsis');
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }

    return (
      <Pagination className="mt-6">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>
          {pages.map((p, idx) =>
            p === 'ellipsis' ? (
              <PaginationItem key={`e-${idx}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={p}>
                <PaginationLink
                  isActive={p === page}
                  onClick={() => setPage(p)}
                  className="cursor-pointer"
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            )
          )}
          <PaginationItem>
            <PaginationNext
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
        <p className="mt-1 text-sm text-slate-500">
          {total > 0 ? `${total} orders` : 'View and manage your orders'}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by Order ID or link..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[170px]">
            <Filter className="h-4 w-4 mr-1.5 text-slate-400" />
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value || 'all'} value={s.value || '__all__'}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="All Time" />
          </SelectTrigger>
          <SelectContent>
            {DATE_OPTIONS.map((d) => (
              <SelectItem key={d.value || 'all'} value={d.value || '__all__'}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <Card className="border-slate-200">
          <CardContent className="p-6"><TableSkeleton /></CardContent>
        </Card>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-slate-100 p-6">
            <ClipboardList className="h-10 w-10 text-slate-400" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">No Orders Found</h2>
          <p className="mt-2 text-sm text-slate-500 max-w-md">
            {search || statusFilter
              ? 'Try adjusting your filters or search query.'
              : "You haven't placed any orders yet."}
          </p>
          {!search && !statusFilter && (
            <Button
              className="mt-4 bg-indigo-600 hover:bg-indigo-700"
              onClick={() => router.push('/dashboard/new-order')}
            >
              Place Your First Order
            </Button>
          )}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' as const }}
        >
          <Card className="border-slate-200">
            <CardContent className="p-0">
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                      <TableHead className="text-slate-500">Order ID</TableHead>
                      <TableHead className="text-slate-500">Service</TableHead>
                      <TableHead className="text-slate-500">Target</TableHead>
                      <TableHead className="text-right text-slate-500">Quantity</TableHead>
                      <TableHead className="text-right text-slate-500">Charge</TableHead>
                      <TableHead className="text-right text-slate-500">Start</TableHead>
                      <TableHead className="text-right text-slate-500">Remains</TableHead>
                      <TableHead className="text-slate-500">Status</TableHead>
                      <TableHead className="text-right text-slate-500">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow
                        key={order.id}
                        className="cursor-pointer"
                        onClick={() => handleRowClick(order.id)}
                      >
                        <TableCell className="font-mono text-xs text-slate-600">
                          #{order.id.slice(0, 8)}
                        </TableCell>
                        <TableCell className="text-sm text-slate-900 max-w-[180px] truncate">
                          {order.service?.name || '—'}
                        </TableCell>
                        <TableCell className="text-sm text-slate-500 max-w-[160px]">
                          <span className="inline-flex items-center gap-1 truncate">
                            {truncate(order.targetUrl, 25)}
                            <ExternalLink className="h-3 w-3 flex-shrink-0 text-slate-300" />
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-sm text-slate-600 tabular-nums">
                          {order.quantity.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium text-slate-900 tabular-nums">
                          {formatCurrency(order.charge)}
                        </TableCell>
                        <TableCell className="text-right text-sm text-slate-500 tabular-nums">
                          {order.startCount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-sm text-slate-500 tabular-nums">
                          {order.remains.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={order.status} />
                        </TableCell>
                        <TableCell className="text-right text-xs text-slate-500 whitespace-nowrap">
                          {timeAgo(order.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden divide-y divide-slate-100">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 hover:bg-slate-50/50 cursor-pointer transition-colors"
                    onClick={() => handleRowClick(order.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-slate-500">
                            #{order.id.slice(0, 8)}
                          </span>
                          <StatusBadge status={order.status} />
                        </div>
                        <p className="text-sm font-medium text-slate-900 mt-1 truncate">
                          {order.service?.name || '—'}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">
                          {truncate(order.targetUrl, 40)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-slate-900 tabular-nums">
                          {formatCurrency(order.charge)}
                        </p>
                        <p className="text-xs text-slate-500 tabular-nums">
                          {order.quantity.toLocaleString()} qty
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          {renderPagination()}
        </motion.div>
      )}
    </div>
  );
}

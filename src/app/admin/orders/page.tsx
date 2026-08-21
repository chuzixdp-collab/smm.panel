'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  MoreHorizontal,
  Eye,
  RefreshCw,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ClipboardList,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { StatusBadge } from '@/components/status-badge';
import { toast } from 'sonner';

const ORDER_STATUSES = [
  'ALL', 'PENDING', 'PROCESSING', 'IN_PROGRESS', 'COMPLETED', 'PARTIAL', 'FAILED', 'CANCELLED',
];

interface Order {
  id: string;
  user?: { name?: string; email: string };
  service?: { name: string };
  target?: string;
  quantity: number;
  charge: number;
  startCount?: number;
  remains?: number;
  status: string;
  providerOrderId?: string;
  createdAt: string;
}

const ITEMS_PER_PAGE = 20;

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { ease: 'easeOut' as const, duration: 0.3 } },
};

function formatCurrency(amount: number) {
  return `$${amount.toFixed(2)}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // View dialog
  const [viewOrder, setViewOrder] = useState<Order | null>(null);

  // Refreshing/cancelling states
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(ITEMS_PER_PAGE) });
      if (search) params.set('search', search);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (dateFilter) params.set('date', dateFilter);
      const res = await fetch(`/api/admin/orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || data.data || []);
        setTotalPages(data.totalPages || Math.ceil((data.total || 0) / ITEMS_PER_PAGE) || 1);
      }
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  }, [page, search, statusFilter, dateFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleRefresh = async (order: Order) => {
    setRefreshingId(order.id);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/refresh`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || 'Status refreshed');
        fetchOrders();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to refresh');
      }
    } catch { toast.error('Failed to refresh'); }
    finally { setRefreshingId(null); }
  };

  const handleCancel = async (order: Order) => {
    setCancellingId(order.id);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/cancel`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || 'Order cancelled');
        fetchOrders();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to cancel');
      }
    } catch { toast.error('Failed to cancel'); }
    finally { setCancellingId(null); }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: 'easeOut' as const, duration: 0.3 }}>
        <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
        <p className="text-sm text-slate-500 mt-1">View and manage all orders</p>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeIn} initial="hidden" animate="show" className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input placeholder="Search by order ID, email, or target URL..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[170px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
          className="w-full sm:w-[160px]"
        />
      </motion.div>

      {/* Table */}
      <motion.div variants={fadeIn} initial="hidden" animate="show" transition={{ delay: 0.1 }}>
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <ClipboardList className="size-12 mb-3" /><p className="text-sm font-medium">No orders found</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Charge</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>Remains</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Provider ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}</TableCell>
                        <TableCell className="text-sm truncate max-w-[120px]">{order.user?.email || '-'}</TableCell>
                        <TableCell className="text-sm truncate max-w-[140px]">{order.service?.name || '-'}</TableCell>
                        <TableCell className="font-mono text-xs text-slate-500 truncate max-w-[120px]">{order.target || '-'}</TableCell>
                        <TableCell className="text-sm">{order.quantity?.toLocaleString()}</TableCell>
                        <TableCell className="text-sm font-medium">{formatCurrency(order.charge)}</TableCell>
                        <TableCell className="text-sm text-slate-500">{order.startCount ?? '-'}</TableCell>
                        <TableCell className="text-sm text-slate-500">{order.remains ?? '-'}</TableCell>
                        <TableCell><StatusBadge status={order.status} /></TableCell>
                        <TableCell className="font-mono text-xs text-slate-500 truncate max-w-[80px]">{order.providerOrderId || '-'}</TableCell>
                        <TableCell className="text-xs text-slate-500">{formatDate(order.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8"><MoreHorizontal className="size-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setViewOrder(order)}><Eye className="size-4" /> View Details</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleRefresh(order)} disabled={refreshingId === order.id}>
                                {refreshingId === order.id ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                                Refresh Status
                              </DropdownMenuItem>
                              {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
                                <DropdownMenuItem onClick={() => handleCancel(order)} disabled={cancellingId === order.id}>
                                  {cancellingId === order.id ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />}
                                  Cancel Order
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="size-4" /></Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="size-4" /></Button>
          </div>
        </div>
      )}

      {/* View Details Dialog */}
      <Dialog open={!!viewOrder} onOpenChange={(open) => { if (!open) setViewOrder(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>Order {viewOrder?.id}</DialogDescription>
          </DialogHeader>
          {viewOrder && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-slate-500">Status:</span><div className="mt-1"><StatusBadge status={viewOrder.status} /></div></div>
                <div><span className="text-slate-500">Charge:</span><p className="font-medium mt-1">{formatCurrency(viewOrder.charge)}</p></div>
                <div><span className="text-slate-500">Quantity:</span><p className="font-medium mt-1">{viewOrder.quantity?.toLocaleString()}</p></div>
                <div><span className="text-slate-500">Start Count:</span><p className="font-medium mt-1">{viewOrder.startCount ?? '-'}</p></div>
                <div><span className="text-slate-500">Remains:</span><p className="font-medium mt-1">{viewOrder.remains ?? '-'}</p></div>
                <div><span className="text-slate-500">Date:</span><p className="font-medium mt-1">{formatDate(viewOrder.createdAt)}</p></div>
              </div>
              <div><span className="text-slate-500">User:</span><p className="font-medium mt-1">{viewOrder.user?.name || viewOrder.user?.email || '-'}</p></div>
              <div><span className="text-slate-500">Service:</span><p className="font-medium mt-1">{viewOrder.service?.name || '-'}</p></div>
              <div><span className="text-slate-500">Target:</span><p className="font-medium mt-1 break-all">{viewOrder.target || '-'}</p></div>
              <div><span className="text-slate-500">Provider Order ID:</span><p className="font-mono mt-1">{viewOrder.providerOrderId || '-'}</p></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

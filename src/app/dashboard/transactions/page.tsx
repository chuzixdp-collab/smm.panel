'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
  Filter,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { formatCurrency, timeAgo } from '@/lib/utils';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balance: number;
  reference: string | null;
  depositId: string | null;
  createdAt: string;
}

const TYPE_OPTIONS = [
  { label: 'All Types', value: '' },
  { label: 'Deposit', value: 'DEPOSIT' },
  { label: 'Order Payment', value: 'ORDER_PAYMENT' },
  { label: 'Refund', value: 'REFUND' },
  { label: 'Admin Adjustment', value: 'ADMIN_ADJUSTMENT' },
  { label: 'Affiliate Commission', value: 'AFFILIATE_COMMISSION' },
  { label: 'Child Panel Charge', value: 'CHILD_PANEL_CHARGE' },
];

const TYPE_STYLES: Record<string, string> = {
  DEPOSIT: 'bg-green-100 text-green-700',
  ORDER_PAYMENT: 'bg-red-100 text-red-700',
  REFUND: 'bg-purple-100 text-purple-700',
  ADMIN_ADJUSTMENT: 'bg-blue-100 text-blue-700',
  AFFILIATE_COMMISSION: 'bg-emerald-100 text-emerald-700',
  CHILD_PANEL_CHARGE: 'bg-orange-100 text-orange-700',
};

const TYPE_LABELS: Record<string, string> = {
  DEPOSIT: 'Deposit',
  ORDER_PAYMENT: 'Order Payment',
  REFUND: 'Refund',
  ADMIN_ADJUSTMENT: 'Admin Adjustment',
  AFFILIATE_COMMISSION: 'Affiliate Commission',
  CHILD_PANEL_CHARGE: 'Panel Charge',
};

const PER_PAGE = 20;

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PER_PAGE),
      });

      const res = await fetch(`/api/wallet/transactions?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        const data = json.data;
        const txns = data?.transactions || [];

        // Client-side type filter since the API doesn't support it
        const filtered = typeFilter
          ? txns.filter((t: Transaction) => t.type === typeFilter)
          : txns;

        setTransactions(filtered);
        setTotal(data?.total || 0);
        setTotalPages(data?.totalPages || 1);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    setPage(1);
  }, [typeFilter]);

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
          <p className="mt-1 text-sm text-slate-500">
            {total > 0 ? `${total} transactions` : 'View your wallet activity'}
          </p>
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="h-4 w-4 mr-1.5 text-slate-400" />
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((t) => (
              <SelectItem key={t.value || 'all'} value={t.value || '__all__'}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {loading ? (
        <Card className="border-slate-200">
          <CardContent className="p-6"><TableSkeleton /></CardContent>
        </Card>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-slate-100 p-6">
            <Receipt className="h-10 w-10 text-slate-400" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">No Transactions</h2>
          <p className="mt-2 text-sm text-slate-500 max-w-md">
            {typeFilter
              ? 'No transactions found for this filter.'
              : 'Your transaction history will appear here.'}
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' as const }}
        >
          <Card className="border-slate-200">
            <CardContent className="p-0">
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                      <TableHead className="text-slate-500">ID</TableHead>
                      <TableHead className="text-slate-500">Type</TableHead>
                      <TableHead className="text-right text-slate-500">Amount</TableHead>
                      <TableHead className="text-right text-slate-500">Balance After</TableHead>
                      <TableHead className="text-slate-500">Reference</TableHead>
                      <TableHead className="text-right text-slate-500">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-mono text-xs text-slate-500">
                          #{tx.id.slice(0, 8)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={TYPE_STYLES[tx.type] || 'bg-slate-100 text-slate-600'}
                          >
                            {TYPE_LABELS[tx.type] || tx.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`inline-flex items-center gap-1 text-sm font-semibold tabular-nums ${
                              tx.amount >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {tx.amount >= 0 ? (
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            ) : (
                              <ArrowDownLeft className="h-3.5 w-3.5" />
                            )}
                            {tx.amount >= 0 ? '+' : ''}
                            {formatCurrency(Math.abs(tx.amount))}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-sm text-slate-700 tabular-nums">
                          {formatCurrency(tx.balance)}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">
                          {tx.reference ? (
                            <span className="font-mono">#{tx.reference.slice(0, 8)}</span>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell className="text-right text-xs text-slate-500 whitespace-nowrap">
                          {timeAgo(tx.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <div key={tx.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={TYPE_STYLES[tx.type] || 'bg-slate-100 text-slate-600 text-[10px]'}
                          >
                            {TYPE_LABELS[tx.type] || tx.type}
                          </Badge>
                          <span className="text-xs text-slate-400">
                            {timeAgo(tx.createdAt)}
                          </span>
                        </div>
                        {tx.reference && (
                          <p className="text-xs text-slate-400 font-mono mt-1">
                            Ref: #{tx.reference.slice(0, 8)}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p
                          className={`text-sm font-semibold tabular-nums ${
                            tx.amount >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {tx.amount >= 0 ? '+' : '-'}
                          {formatCurrency(Math.abs(tx.amount))}
                        </p>
                        <p className="text-xs text-slate-400 tabular-nums mt-0.5">
                          Bal: {formatCurrency(tx.balance)}
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

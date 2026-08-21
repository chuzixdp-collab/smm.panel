'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Inbox,
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
import { Badge } from '@/components/ui/badge';

const TRANSACTION_TYPES = [
  'ALL', 'DEPOSIT', 'ORDER_PAYMENT', 'REFUND', 'ADMIN_ADJUSTMENT', 'AFFILIATE_COMMISSION', 'CHILD_PANEL_CHARGE',
];

const typeBadgeStyles: Record<string, string> = {
  DEPOSIT: 'bg-green-100 text-green-700 hover:bg-green-100',
  ORDER_PAYMENT: 'bg-red-100 text-red-700 hover:bg-red-100',
  REFUND: 'bg-purple-100 text-purple-700 hover:bg-purple-100',
  ADMIN_ADJUSTMENT: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  AFFILIATE_COMMISSION: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  CHILD_PANEL_CHARGE: 'bg-orange-100 text-orange-700 hover:bg-orange-100',
};

interface Transaction {
  id: string;
  user?: { email: string };
  type: string;
  amount: number;
  balanceAfter: number;
  reference?: string;
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

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(ITEMS_PER_PAGE),
      });
      if (search) params.set('search', search);
      if (typeFilter !== 'ALL') params.set('type', typeFilter);
      if (dateFilter) params.set('date', dateFilter);

      const res = await fetch(`/api/admin/transactions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || data.data || []);
        setTotalPages(data.totalPages || Math.ceil((data.total || 0) / ITEMS_PER_PAGE) || 1);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, dateFilter, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isCredit = (type: string) => ['DEPOSIT', 'REFUND', 'ADMIN_ADJUSTMENT', 'AFFILIATE_COMMISSION'].includes(type);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: 'easeOut' as const, duration: 0.3 }}>
        <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
        <p className="text-sm text-slate-500 mt-1">View all wallet transactions across the platform</p>
      </motion.div>

      <motion.div variants={fadeIn} initial="hidden" animate="show">
        <Card>
          <CardContent className="pt-6 space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  placeholder="Search by email or reference..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {TRANSACTION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t === 'ALL' ? 'All Types' : t.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                className="w-full sm:w-[180px]"
                value={dateFilter}
                onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
              />
            </div>

            {/* Table */}
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Inbox className="size-12 mb-3" />
                <p className="text-sm font-medium">No transactions found</p>
                <p className="text-xs mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <>
                <div className="max-h-[520px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Balance After</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="font-mono text-xs">{tx.id.slice(0, 8)}</TableCell>
                          <TableCell className="text-sm truncate max-w-[160px]">{tx.user?.email || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={typeBadgeStyles[tx.type] || ''}>
                              {tx.type.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className={`text-sm font-semibold ${isCredit(tx.type) ? 'text-green-600' : 'text-red-600'}`}>
                            {isCredit(tx.type) ? '+' : '-'}{formatCurrency(tx.amount)}
                          </TableCell>
                          <TableCell className="text-sm">{formatCurrency(tx.balanceAfter)}</TableCell>
                          <TableCell className="text-xs text-slate-500 truncate max-w-[100px]">{tx.reference || '-'}</TableCell>
                          <TableCell className="text-xs text-slate-500 whitespace-nowrap">{formatDate(tx.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                      <ChevronLeft className="size-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Shield,
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

const ACTION_FILTERS = [
  'ALL', 'USER_CREATE', 'USER_UPDATE', 'USER_DELETE', 'USER_SUSPEND',
  'ORDER_UPDATE', 'DEPOSIT_APPROVE', 'DEPOSIT_REJECT',
  'SERVICE_CREATE', 'SERVICE_UPDATE', 'SERVICE_DELETE',
  'SETTINGS_UPDATE', 'TICKET_CLOSE',
];

const actionStyles: Record<string, string> = {
  USER_CREATE: 'bg-green-100 text-green-700 hover:bg-green-100',
  USER_UPDATE: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  USER_DELETE: 'bg-red-100 text-red-700 hover:bg-red-100',
  USER_SUSPEND: 'bg-orange-100 text-orange-700 hover:bg-orange-100',
  ORDER_UPDATE: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-100',
  DEPOSIT_APPROVE: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
  DEPOSIT_REJECT: 'bg-red-100 text-red-700 hover:bg-red-100',
  SERVICE_CREATE: 'bg-violet-100 text-violet-700 hover:bg-violet-100',
  SERVICE_UPDATE: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  SERVICE_DELETE: 'bg-red-100 text-red-700 hover:bg-red-100',
  SETTINGS_UPDATE: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  TICKET_CLOSE: 'bg-slate-100 text-slate-700 hover:bg-slate-100',
};

interface AuditLog {
  id: string;
  admin?: { email: string };
  adminEmail?: string;
  action: string;
  target?: string;
  previousValue?: string | null;
  newValue?: string | null;
  ipAddress?: string;
  createdAt: string;
}

const ITEMS_PER_PAGE = 20;

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { ease: 'easeOut' as const, duration: 0.3 } },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function truncate(str: string | null | undefined, max: number = 50) {
  if (!str) return '-';
  return str.length > max ? str.slice(0, max) + '...' : str;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(ITEMS_PER_PAGE),
      });
      if (search) params.set('search', search);
      if (actionFilter !== 'ALL') params.set('action', actionFilter);
      if (dateFilter) params.set('date', dateFilter);

      const res = await fetch(`/api/admin/audit-logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || data.data || []);
        setTotalPages(data.totalPages || Math.ceil((data.total || 0) / ITEMS_PER_PAGE) || 1);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [search, actionFilter, dateFilter, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: 'easeOut' as const, duration: 0.3 }}>
        <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
        <p className="text-sm text-slate-500 mt-1">Track all admin actions on the platform</p>
      </motion.div>

      <motion.div variants={fadeIn} initial="hidden" animate="show">
        <Card>
          <CardContent className="pt-6 space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  placeholder="Search by admin email or action..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_FILTERS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a === 'ALL' ? 'All Actions' : a.replace(/_/g, ' ')}
                    </SelectItem>
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

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Shield className="size-12 mb-3" />
                <p className="text-sm font-medium">No audit logs found</p>
                <p className="text-xs mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <>
                <div className="max-h-[520px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Admin</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Target</TableHead>
                        <TableHead>Previous Value</TableHead>
                        <TableHead>New Value</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-xs">{log.id.slice(0, 8)}</TableCell>
                          <TableCell className="text-sm truncate max-w-[150px]">
                            {log.admin?.email || log.adminEmail || '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={actionStyles[log.action] || 'bg-slate-100 text-slate-700'}>
                              {log.action.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm truncate max-w-[120px]">{log.target || '-'}</TableCell>
                          <TableCell className="text-xs text-slate-500 max-w-[100px]" title={log.previousValue || undefined}>
                            {truncate(log.previousValue)}
                          </TableCell>
                          <TableCell className="text-xs text-slate-500 max-w-[100px]" title={log.newValue || undefined}>
                            {truncate(log.newValue)}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-500">{log.ipAddress || '-'}</TableCell>
                          <TableCell className="text-xs text-slate-500 whitespace-nowrap">{formatDate(log.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

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
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  XCircle,
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
import { StatusBadge } from '@/components/status-badge';
import { toast } from 'sonner';

const STATUS_OPTIONS = ['ALL', 'OPEN', 'ANSWERED', 'CLOSED'];
const PRIORITY_OPTIONS = ['ALL', 'LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const priorityStyles: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-600 hover:bg-slate-100',
  MEDIUM: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  HIGH: 'bg-orange-100 text-orange-700 hover:bg-orange-100',
  URGENT: 'bg-red-100 text-red-700 hover:bg-red-100',
};

interface Ticket {
  id: string;
  subject: string;
  user?: { name?: string; email: string };
  category?: string;
  priority: string;
  status: string;
  messagesCount?: number;
  updatedAt: string;
}

const ITEMS_PER_PAGE = 20;

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { ease: 'easeOut' as const, duration: 0.3 } },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function TicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(ITEMS_PER_PAGE) });
      if (search) params.set('search', search);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (priorityFilter !== 'ALL') params.set('priority', priorityFilter);

      const res = await fetch(`/api/admin/support/tickets?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || data.data || []);
        setTotalPages(data.totalPages || Math.ceil((data.total || 0) / ITEMS_PER_PAGE) || 1);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCloseTicket = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/support/tickets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CLOSED' }),
      });
      if (res.ok) {
        toast.success('Ticket closed successfully');
        fetchData();
      } else {
        toast.error('Failed to close ticket');
      }
    } catch {
      toast.error('Failed to close ticket');
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: 'easeOut' as const, duration: 0.3 }}>
        <h1 className="text-2xl font-bold text-slate-900">Support Tickets</h1>
        <p className="text-sm text-slate-500 mt-1">Manage all customer support tickets</p>
      </motion.div>

      <motion.div variants={fadeIn} initial="hidden" animate="show">
        <Card>
          <CardContent className="pt-6 space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  placeholder="Search by subject or email..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s.charAt(0) + s.slice(1).toLowerCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>{p === 'ALL' ? 'All Priorities' : p.charAt(0) + p.slice(1).toLowerCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Inbox className="size-12 mb-3" />
                <p className="text-sm font-medium">No tickets found</p>
                <p className="text-xs mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <>
                <div className="max-h-[520px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Messages</TableHead>
                        <TableHead>Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tickets.map((ticket) => (
                        <TableRow key={ticket.id}>
                          <TableCell className="font-mono text-xs">{ticket.id.slice(0, 8)}</TableCell>
                          <TableCell className="font-medium text-sm truncate max-w-[200px]">{ticket.subject}</TableCell>
                          <TableCell className="text-sm truncate max-w-[150px]">{ticket.user?.email || '-'}</TableCell>
                          <TableCell className="text-sm">{ticket.category || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={priorityStyles[ticket.priority] || ''}>
                              {ticket.priority}
                            </Badge>
                          </TableCell>
                          <TableCell><StatusBadge status={ticket.status} /></TableCell>
                          <TableCell className="text-sm text-right">{ticket.messagesCount ?? 0}</TableCell>
                          <TableCell className="text-xs text-slate-500 whitespace-nowrap">{formatDate(ticket.updatedAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="size-8" onClick={() => router.push(`/admin/tickets/${ticket.id}`)}>
                                <Eye className="size-4" />
                              </Button>
                              {ticket.status !== 'CLOSED' && (
                                <Button variant="ghost" size="icon" className="size-8 text-red-500 hover:text-red-600" onClick={() => handleCloseTicket(ticket.id)}>
                                  <XCircle className="size-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
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
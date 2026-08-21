'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, XCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/status-badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const STATUS_TABS = ['ALL', 'OPEN', 'ANSWERED', 'CLOSED'];

interface Ticket {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  subject: string;
  category: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminSupportPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
      });
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/support/tickets?${params}`);
      if (res.ok) {
        const json = await res.json();
        setTickets(json.data.tickets || json.data || []);
        setTotalPages(json.data.totalPages || 1);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTickets();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Support Tickets</h2>
        <p className="text-sm text-gray-500">Manage customer support requests</p>
      </div>

      <div className="flex flex-col gap-4">
        <Tabs value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <TabsList className="flex-wrap h-auto gap-1 bg-gray-100 p-1">
            {STATUS_TABS.map((s) => (
              <TabsTrigger key={s} value={s} className="text-xs px-3 py-1.5">
                {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 pl-9"
            />
          </div>
          <Button type="submit" className="bg-gradient-to-r from-blue-500 to-purple-500">
            Search
          </Button>
        </form>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-3 p-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <XCircle className="mb-3 h-12 w-12 text-gray-300" />
                <p className="text-sm text-gray-500">No tickets found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-mono text-xs">
                        {ticket.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="text-sm">
                        {ticket.userEmail || ticket.userName || ticket.userId.slice(0, 8)}
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">
                        {ticket.subject}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">{ticket.category}</span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={ticket.status} />
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/support/${ticket.id}`)}
                        >
                          <Eye className="mr-1 h-4 w-4" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="space-y-3 md:hidden">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <XCircle className="mb-3 h-12 w-12 text-gray-300" />
            <p className="text-sm text-gray-500">No tickets found</p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <Card
              key={ticket.id}
              className="cursor-pointer border-0 shadow-sm transition-shadow hover:shadow-md"
              onClick={() => router.push(`/admin/support/${ticket.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={ticket.status} />
                      <span className="text-xs text-gray-400">
                        {ticket.id.slice(0, 8)}
                      </span>
                    </div>
                    <p className="mt-1 truncate font-medium text-gray-900">
                      {ticket.subject}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span>{ticket.userEmail || ticket.userId.slice(0, 8)}</span>
                      <span>{ticket.category}</span>
                      <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Eye className="ml-2 h-4 w-4 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

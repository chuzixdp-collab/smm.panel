'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  MoreHorizontal,
  Eye,
  CheckCircle2,
  XCircle,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Banknote,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { StatusBadge } from '@/components/status-badge';
import { toast } from 'sonner';

const DEPOSIT_STATUSES = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'];

interface Deposit {
  id: string;
  user?: { name?: string; email: string };
  amount: number;
  paymentMethod: string;
  transactionId?: string;
  screenshot?: string;
  status: string;
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

export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Screenshot dialog
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);

  // Approve dialog (optional note)
  const [approveTarget, setApproveTarget] = useState<Deposit | null>(null);
  const [approveNote, setApproveNote] = useState('');
  const [approveLoading, setApproveLoading] = useState(false);

  // Reject dialog (required note)
  const [rejectTarget, setRejectTarget] = useState<Deposit | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);

  const fetchDeposits = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(ITEMS_PER_PAGE) });
      if (search) params.set('search', search);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      const res = await fetch(`/api/admin/deposits?${params}`);
      if (res.ok) {
        const data = await res.json();
        const payload = data.data || data;
        setDeposits(payload.deposits || []);
        setTotalPages(payload.totalPages || Math.ceil((payload.total || 0) / ITEMS_PER_PAGE) || 1);
      }
    } catch { toast.error('Failed to load deposits'); }
    finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchDeposits(); }, [fetchDeposits]);

  const handleApprove = async () => {
    if (!approveTarget) return;
    setApproveLoading(true);
    try {
      const res = await fetch(`/api/admin/deposits/${approveTarget.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNote: approveNote || undefined }),
      });
      if (res.ok) {
        toast.success('Deposit approved');
        setApproveTarget(null);
        setApproveNote('');
        fetchDeposits();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to approve');
      }
    } catch { toast.error('Failed to approve'); }
    finally { setApproveLoading(false); }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    if (!rejectNote.trim()) { toast.error('Please provide a reason for rejection'); return; }
    setRejectLoading(true);
    try {
      const res = await fetch(`/api/admin/deposits/${rejectTarget.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNote: rejectNote }),
      });
      if (res.ok) {
        toast.success('Deposit rejected');
        setRejectTarget(null);
        setRejectNote('');
        fetchDeposits();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to reject');
      }
    } catch { toast.error('Failed to reject'); }
    finally { setRejectLoading(false); }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: 'easeOut' as const, duration: 0.3 }}>
        <h1 className="text-2xl font-bold text-slate-900">Deposits</h1>
        <p className="text-sm text-slate-500 mt-1">Review and manage user deposits</p>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeIn} initial="hidden" animate="show" className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input placeholder="Search by email or transaction ID..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            {DEPOSIT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s.charAt(0) + s.slice(1).toLowerCase()}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Table */}
      <motion.div variants={fadeIn} initial="hidden" animate="show" transition={{ delay: 0.1 }}>
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : deposits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Banknote className="size-12 mb-3" /><p className="text-sm font-medium">No deposits found</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Screenshot</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deposits.map((dep) => (
                      <TableRow key={dep.id}>
                        <TableCell className="font-mono text-xs">{dep.id.slice(0, 8)}</TableCell>
                        <TableCell className="text-sm truncate max-w-[130px]">{dep.user?.name || dep.user?.email || '-'}</TableCell>
                        <TableCell className="text-sm font-medium text-emerald-600">{formatCurrency(dep.amount)}</TableCell>
                        <TableCell className="text-sm">{dep.paymentMethod || '-'}</TableCell>
                        <TableCell className="font-mono text-xs text-slate-500 truncate max-w-[100px]">{dep.transactionId || '-'}</TableCell>
                        <TableCell>
                          {dep.screenshot ? (
                            <Button variant="ghost" size="sm" className="gap-1 text-indigo-600" onClick={() => setScreenshotUrl(dep.screenshot!)}>
                              <ImageIcon className="size-3.5" /> View
                            </Button>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </TableCell>
                        <TableCell><StatusBadge status={dep.status} /></TableCell>
                        <TableCell className="text-xs text-slate-500">{formatDate(dep.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          {dep.status === 'PENDING' && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8"><MoreHorizontal className="size-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {dep.screenshot && (
                                  <DropdownMenuItem onClick={() => setScreenshotUrl(dep.screenshot!)}><Eye className="size-4" /> View Screenshot</DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => { setApproveTarget(dep); setApproveNote(''); }}><CheckCircle2 className="size-4" /> Approve</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setRejectTarget(dep); setRejectNote(''); }} className="text-red-600"><XCircle className="size-4" /> Reject</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
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

      {/* Screenshot Dialog */}
      <Dialog open={!!screenshotUrl} onOpenChange={(open) => { if (!open) setScreenshotUrl(null); }}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Payment Screenshot</DialogTitle>
            <DialogDescription>Deposit proof from user</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center">
            <img src={screenshotUrl!} alt="Payment screenshot" className="max-w-full max-h-[70vh] rounded-lg border object-contain" />
          </div>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={!!approveTarget} onOpenChange={(open) => { if (!open) { setApproveTarget(null); setApproveNote(''); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Deposit</DialogTitle>
            <DialogDescription>
              Approve deposit of {formatCurrency(approveTarget?.amount || 0)} from {approveTarget?.user?.email || 'user'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="approve-note">Note (optional)</Label>
              <Textarea id="approve-note" placeholder="Optional note for approval..." value={approveNote} onChange={(e) => setApproveNote(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setApproveTarget(null); setApproveNote(''); }}>Cancel</Button>
            <Button onClick={handleApprove} disabled={approveLoading} className="bg-emerald-600 hover:bg-emerald-700">
              {approveLoading && <Loader2 className="size-4 animate-spin" />} Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(open) => { if (!open) { setRejectTarget(null); setRejectNote(''); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Deposit</DialogTitle>
            <DialogDescription>
              Reject deposit of {formatCurrency(rejectTarget?.amount || 0)} from {rejectTarget?.user?.email || 'user'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="reject-note">Reason *</Label>
              <Textarea id="reject-note" placeholder="Reason for rejection (required)..." value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectNote(''); }}>Cancel</Button>
            <Button onClick={handleReject} disabled={rejectLoading} className="bg-red-600 hover:bg-red-700">
              {rejectLoading && <Loader2 className="size-4 animate-spin" />} Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

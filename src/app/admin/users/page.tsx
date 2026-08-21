'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Search,
  MoreHorizontal,
  Eye,
  Ban,
  CheckCircle2,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Users,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/status-badge';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  balance: number;
  totalSpent: number;
  status: string;
  ordersCount: number;
  createdAt: string;
}

const ITEMS_PER_PAGE = 15;

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { ease: 'easeOut' as const, duration: 0.3 } },
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatCurrency(amount: number) {
  return `$${amount.toFixed(2)}`;
}

const roleBadgeStyle: Record<string, string> = {
  USER: 'bg-slate-100 text-slate-700 hover:bg-slate-100',
  ADMIN: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-100',
  SUPER_ADMIN: 'bg-violet-100 text-violet-700 hover:bg-violet-100',
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Adjust balance dialog
  const [balanceUser, setBalanceUser] = useState<User | null>(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceReason, setBalanceReason] = useState('');
  const [balanceLoading, setBalanceLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(ITEMS_PER_PAGE),
      });
      if (search) params.set('search', search);
      if (roleFilter !== 'ALL') params.set('role', roleFilter);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);

      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || data.data || []);
        setTotalPages(data.totalPages || Math.ceil((data.total || 0) / ITEMS_PER_PAGE) || 1);
      }
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(`User ${newStatus === 'SUSPENDED' ? 'suspended' : 'activated'} successfully`);
        fetchUsers();
      } else {
        toast.error('Failed to update user status');
      }
    } catch {
      toast.error('Failed to update user status');
    }
  };

  const handleAdjustBalance = async () => {
    if (!balanceUser || !balanceAmount || !balanceReason) {
      toast.error('Please fill all fields');
      return;
    }
    setBalanceLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${balanceUser.id}/adjust-balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(balanceAmount), reason: balanceReason }),
      });
      if (res.ok) {
        toast.success('Balance adjusted successfully');
        setBalanceUser(null);
        setBalanceAmount('');
        setBalanceReason('');
        fetchUsers();
      } else {
        toast.error('Failed to adjust balance');
      }
    } catch {
      toast.error('Failed to adjust balance');
    } finally {
      setBalanceLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: 'easeOut' as const, duration: 0.3 }}>
        <h1 className="text-2xl font-bold text-slate-900">Users</h1>
        <p className="text-sm text-slate-500 mt-1">Manage all registered users</p>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeIn} initial="hidden" animate="show" className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Roles</SelectItem>
            <SelectItem value="USER">User</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Table */}
      <motion.div variants={fadeIn} initial="hidden" animate="show" transition={{ delay: 0.1 }}>
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Users className="size-12 mb-3" />
                <p className="text-sm font-medium">No users found</p>
                <p className="text-xs mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Total Spent</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow
                        key={user.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/admin/users/${user.id}`)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <Avatar className="size-8">
                              <AvatarFallback className="bg-indigo-100 text-indigo-600 text-xs font-semibold">
                                {getInitials(user.name || 'U')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm text-slate-900 truncate max-w-[120px]">
                              {user.name || '-'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-500 truncate max-w-[160px]">
                          {user.email}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={roleBadgeStyle[user.role] || ''}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm font-medium">{formatCurrency(user.balance)}</TableCell>
                        <TableCell className="text-sm text-slate-600">{formatCurrency(user.totalSpent)}</TableCell>
                        <TableCell><StatusBadge status={user.status} /></TableCell>
                        <TableCell className="text-sm text-slate-600">{user.ordersCount || 0}</TableCell>
                        <TableCell className="text-xs text-slate-500">{formatDate(user.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="size-8">
                                <MoreHorizontal className="size-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/admin/users/${user.id}`); }}>
                                <Eye className="size-4" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleToggleStatus(user); }}>
                                {user.status === 'ACTIVE' ? <Ban className="size-4" /> : <CheckCircle2 className="size-4" />}
                                {user.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setBalanceUser(user); setBalanceAmount(''); setBalanceReason(''); }}>
                                <DollarSign className="size-4" /> Adjust Balance
                              </DropdownMenuItem>
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
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Adjust Balance Dialog */}
      <Dialog open={!!balanceUser} onOpenChange={(open) => { if (!open) setBalanceUser(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Balance</DialogTitle>
            <DialogDescription>
              Adjusting balance for {balanceUser?.name || balanceUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Current Balance</Label>
              <p className="text-sm font-medium text-slate-700">{balanceUser ? formatCurrency(balanceUser.balance) : '-'}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="balance-amount">Amount (use negative for deduction)</Label>
              <Input
                id="balance-amount"
                type="number"
                step="0.01"
                placeholder="e.g. 50.00 or -25.00"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="balance-reason">Reason</Label>
              <Textarea
                id="balance-reason"
                placeholder="Enter reason for balance adjustment..."
                value={balanceReason}
                onChange={(e) => setBalanceReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBalanceUser(null)}>Cancel</Button>
            <Button onClick={handleAdjustBalance} disabled={balanceLoading} className="bg-indigo-600 hover:bg-indigo-700">
              {balanceLoading ? 'Processing...' : 'Submit Adjustment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

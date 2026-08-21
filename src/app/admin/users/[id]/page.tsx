'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Mail,
  Calendar,
  Clock,
  ShieldCheck,
  Ban,
  CheckCircle2,
  DollarSign,
  ShoppingCart,
  CreditCard,
  TicketCheck,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StatusBadge } from '@/components/status-badge';
import { toast } from 'sonner';

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  balance: number;
  status: string;
  createdAt: string;
  lastLogin?: string;
  stats: {
    totalOrders: number;
    totalSpent: number;
    depositCount: number;
    activeTickets: number;
  };
}

interface Order {
  id: string;
  service?: { name: string };
  status: string;
  charge: number;
  quantity: number;
  target?: string;
  createdAt: string;
}

interface Deposit {
  id: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description?: string;
  createdAt: string;
}

interface Ticket {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
}

const roleBadgeStyle: Record<string, string> = {
  USER: 'bg-slate-100 text-slate-700 hover:bg-slate-100',
  ADMIN: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-100',
  SUPER_ADMIN: 'bg-violet-100 text-violet-700 hover:bg-violet-100',
};

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { ease: 'easeOut' as const, duration: 0.3 } },
};

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatCurrency(amount: number) {
  return `$${amount.toFixed(2)}`;
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Tab data
  const [orders, setOrders] = useState<Order[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [tabLoading, setTabLoading] = useState(false);

  // Balance dialog
  const [balanceDialog, setBalanceDialog] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceReason, setBalanceReason] = useState('');
  const [balanceLoading, setBalanceLoading] = useState(false);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data.user || data);
      } else {
        toast.error('User not found');
      }
    } catch {
      toast.error('Failed to load user');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchTabData = useCallback(async (tab: string) => {
    setTabLoading(true);
    try {
      let url = '';
      if (tab === 'orders') url = `/api/admin/orders?userId=${userId}&limit=50`;
      else if (tab === 'deposits') url = `/api/admin/deposits?userId=${userId}&limit=50`;
      else if (tab === 'transactions') url = `/api/admin/users/${userId}/transactions`;
      else if (tab === 'tickets') url = `/api/admin/tickets?userId=${userId}`;
      else { setTabLoading(false); return; }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (tab === 'orders') setOrders(data.orders || data.data || []);
        else if (tab === 'deposits') setDeposits(data.deposits || data.data || []);
        else if (tab === 'transactions') setTransactions(data.transactions || data.data || []);
        else if (tab === 'tickets') setTickets(data.tickets || data.data || []);
      }
    } catch {
      // silent
    } finally {
      setTabLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleToggleStatus = async () => {
    if (!user) return;
    const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(`User ${newStatus === 'SUSPENDED' ? 'suspended' : 'activated'}`);
        fetchUser();
      } else toast.error('Failed to update status');
    } catch { toast.error('Failed to update status'); }
  };

  const handleAdjustBalance = async () => {
    if (!balanceAmount || !balanceReason) { toast.error('Please fill all fields'); return; }
    setBalanceLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/adjust-balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(balanceAmount), reason: balanceReason }),
      });
      if (res.ok) {
        toast.success('Balance adjusted');
        setBalanceDialog(false);
        setBalanceAmount('');
        setBalanceReason('');
        fetchUser();
      } else toast.error('Failed to adjust balance');
    } catch { toast.error('Failed to adjust balance'); }
    finally { setBalanceLoading(false); }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 md:p-6">
        <Button variant="ghost" onClick={() => router.push('/admin/users')} className="gap-2 mb-4">
          <ArrowLeft className="size-4" /> Back to Users
        </Button>
        <p className="text-slate-500">User not found.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Back + Title */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: 'easeOut' as const, duration: 0.3 }}>
        <Button variant="ghost" onClick={() => router.push('/admin/users')} className="gap-2 mb-3 text-slate-600">
          <ArrowLeft className="size-4" /> Back to Users
        </Button>
        <h1 className="text-2xl font-bold text-slate-900">User Details</h1>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Info Card */}
        <motion.div variants={fadeIn} initial="hidden" animate="show">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="size-20 mb-4">
                  <AvatarFallback className="bg-indigo-100 text-indigo-600 text-xl font-bold">
                    {getInitials(user.name || 'U')}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-lg font-bold text-slate-900">{user.name || 'Unnamed'}</h2>
                <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1">
                  <Mail className="size-3.5" /> {user.email}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="secondary" className={roleBadgeStyle[user.role] || ''}>
                    {user.role}
                  </Badge>
                  <StatusBadge status={user.status} />
                </div>
                <Separator className="my-4" />
                <div className="w-full space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Balance</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(user.balance)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-1.5"><Calendar className="size-3.5" /> Joined</span>
                    <span className="text-slate-700">{formatDate(user.createdAt)}</span>
                  </div>
                  {user.lastLogin && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 flex items-center gap-1.5"><Clock className="size-3.5" /> Last Login</span>
                      <span className="text-slate-700">{formatDate(user.lastLogin)}</span>
                    </div>
                  )}
                </div>
                <Separator className="my-4" />
                <div className="flex gap-2 w-full">
                  <Button
                    variant={user.status === 'ACTIVE' ? 'destructive' : 'default'}
                    size="sm"
                    className="flex-1 gap-1.5"
                    onClick={handleToggleStatus}
                  >
                    {user.status === 'ACTIVE' ? <Ban className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}
                    {user.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => setBalanceDialog(true)}>
                    <DollarSign className="size-3.5" /> Adjust Balance
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats + Tabs */}
        <motion.div variants={fadeIn} initial="hidden" animate="show" transition={{ delay: 0.1 }} className="lg:col-span-2 space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Orders', value: user.stats?.totalOrders || 0, icon: ShoppingCart, color: 'text-indigo-600 bg-indigo-50' },
              { label: 'Total Spent', value: formatCurrency(user.stats?.totalSpent || 0), icon: DollarSign, color: 'text-emerald-600 bg-emerald-50' },
              { label: 'Deposits', value: user.stats?.depositCount || 0, icon: CreditCard, color: 'text-amber-600 bg-amber-50' },
              { label: 'Active Tickets', value: user.stats?.activeTickets || 0, icon: TicketCheck, color: 'text-violet-600 bg-violet-50' },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.color}`}>
                    <stat.icon className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{stat.label}</p>
                    <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="orders" onValueChange={(v) => fetchTabData(v)}>
            <TabsList>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="deposits">Deposits</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="tickets">Tickets</TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  {tabLoading ? (
                    <div className="p-4 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                  ) : orders.length === 0 ? (
                    <div className="py-12 text-center text-sm text-slate-400">No orders found</div>
                  ) : (
                    <div className="overflow-x-auto max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Service</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Charge</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}</TableCell>
                              <TableCell className="text-sm truncate max-w-[160px]">{order.service?.name || '-'}</TableCell>
                              <TableCell><StatusBadge status={order.status} /></TableCell>
                              <TableCell className="text-sm font-medium">{formatCurrency(order.charge)}</TableCell>
                              <TableCell className="text-sm">{order.quantity?.toLocaleString()}</TableCell>
                              <TableCell className="text-xs text-slate-500">{formatDate(order.createdAt)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="deposits" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  {tabLoading ? (
                    <div className="p-4 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                  ) : deposits.length === 0 ? (
                    <div className="py-12 text-center text-sm text-slate-400">No deposits found</div>
                  ) : (
                    <div className="overflow-x-auto max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {deposits.map((dep) => (
                            <TableRow key={dep.id}>
                              <TableCell className="font-mono text-xs">{dep.id.slice(0, 8)}</TableCell>
                              <TableCell className="text-sm font-medium text-emerald-600">{formatCurrency(dep.amount)}</TableCell>
                              <TableCell className="text-sm">{dep.method || '-'}</TableCell>
                              <TableCell><StatusBadge status={dep.status} /></TableCell>
                              <TableCell className="text-xs text-slate-500">{formatDate(dep.createdAt)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transactions" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  {tabLoading ? (
                    <div className="p-4 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                  ) : transactions.length === 0 ? (
                    <div className="py-12 text-center text-sm text-slate-400">No transactions found</div>
                  ) : (
                    <div className="overflow-x-auto max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Before</TableHead>
                            <TableHead>After</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.map((tx) => (
                            <TableRow key={tx.id}>
                              <TableCell className="font-mono text-xs">{tx.id.slice(0, 8)}</TableCell>
                              <TableCell><StatusBadge status={tx.type} /></TableCell>
                              <TableCell className={`text-sm font-medium ${tx.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                              </TableCell>
                              <TableCell className="text-sm">{formatCurrency(tx.balanceBefore)}</TableCell>
                              <TableCell className="text-sm">{formatCurrency(tx.balanceAfter)}</TableCell>
                              <TableCell className="text-xs text-slate-500 truncate max-w-[140px]">{tx.description || '-'}</TableCell>
                              <TableCell className="text-xs text-slate-500">{formatDate(tx.createdAt)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tickets" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  {tabLoading ? (
                    <div className="p-4 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                  ) : tickets.length === 0 ? (
                    <div className="py-12 text-center text-sm text-slate-400">No tickets found</div>
                  ) : (
                    <div className="overflow-x-auto max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tickets.map((ticket) => (
                            <TableRow key={ticket.id}>
                              <TableCell className="font-mono text-xs">{ticket.id.slice(0, 8)}</TableCell>
                              <TableCell className="text-sm">{ticket.subject}</TableCell>
                              <TableCell><StatusBadge status={ticket.status} /></TableCell>
                              <TableCell className="text-xs text-slate-500">{formatDate(ticket.createdAt)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Adjust Balance Dialog */}
      <Dialog open={balanceDialog} onOpenChange={setBalanceDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Balance</DialogTitle>
            <DialogDescription>Adjusting balance for {user.name || user.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Current Balance</Label>
              <p className="text-sm font-medium text-slate-700">{formatCurrency(user.balance)}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bal-amt">Amount (negative for deduction)</Label>
              <Input id="bal-amt" type="number" step="0.01" placeholder="e.g. 50.00 or -25.00" value={balanceAmount} onChange={(e) => setBalanceAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bal-reason">Reason</Label>
              <Textarea id="bal-reason" placeholder="Enter reason..." value={balanceReason} onChange={(e) => setBalanceReason(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBalanceDialog(false)}>Cancel</Button>
            <Button onClick={handleAdjustBalance} disabled={balanceLoading} className="bg-indigo-600 hover:bg-indigo-700">
              {balanceLoading ? 'Processing...' : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users,
  ShoppingCart,
  DollarSign,
  Clock,
  Package,
  Loader2,
  TrendingUp,
  Zap,
  Server,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/status-badge';

interface Stats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingDeposits: number;
  activeServices: number;
  pendingOrders: number;
  todayOrders: number;
  totalProviders: number;
}

interface RecentOrder {
  id: string;
  userEmail: string;
  service?: { name: string };
  status: string;
  charge: number;
  createdAt: string;
}

interface RecentDeposit {
  id: string;
  user?: { name?: string; email: string };
  amount: number;
  method: string;
  status: string;
  createdAt: string;
}

const statCards = [
  { key: 'totalUsers', label: 'Total Users', icon: Users, color: 'indigo', border: 'border-l-indigo-500', bg: 'bg-indigo-50', iconBg: 'bg-indigo-100 text-indigo-600' },
  { key: 'totalOrders', label: 'Total Orders', icon: ShoppingCart, color: 'emerald', border: 'border-l-emerald-500', bg: 'bg-emerald-50', iconBg: 'bg-emerald-100 text-emerald-600' },
  { key: 'totalRevenue', label: 'Total Revenue', icon: DollarSign, color: 'amber', border: 'border-l-amber-500', bg: 'bg-amber-50', iconBg: 'bg-amber-100 text-amber-600' },
  { key: 'pendingDeposits', label: 'Pending Deposits', icon: Clock, color: 'violet', border: 'border-l-violet-500', bg: 'bg-violet-50', iconBg: 'bg-violet-100 text-violet-600' },
  { key: 'activeServices', label: 'Active Services', icon: Package, color: 'blue', border: 'border-l-blue-500', bg: 'bg-blue-50', iconBg: 'bg-blue-100 text-blue-600' },
  { key: 'pendingOrders', label: 'Pending Orders', icon: Loader2, color: 'orange', border: 'border-l-orange-500', bg: 'bg-orange-50', iconBg: 'bg-orange-100 text-orange-600' },
  { key: 'todayOrders', label: "Today's Orders", icon: TrendingUp, color: 'indigo', border: 'border-l-indigo-400', bg: 'bg-indigo-50', iconBg: 'bg-indigo-100 text-indigo-600' },
  { key: 'totalProviders', label: 'Total Providers', icon: Server, color: 'emerald', border: 'border-l-emerald-400', bg: 'bg-emerald-50', iconBg: 'bg-emerald-100 text-emerald-600' },
] as const;

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { ease: 'easeOut' as const, duration: 0.4 } },
};

function formatCurrency(amount: number) {
  return `$${amount.toFixed(2)}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentDeposits, setRecentDeposits] = useState<RecentDeposit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats || data);
        setRecentOrders(data.recentOrders || []);
        setRecentDeposits(data.recentDeposits || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: 'easeOut' as const, duration: 0.3 }}>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Overview of your SMM panel performance</p>
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.div key={card.key} variants={item}>
              <Card className={`border-l-4 ${card.border}`}>
                <CardContent className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${card.iconBg}`}>
                    <Icon className="size-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-500 truncate">{card.label}</p>
                    {loading ? (
                      <Skeleton className="mt-1 h-7 w-20" />
                    ) : (
                      <p className="text-2xl font-bold text-slate-900">
                        {card.key === 'totalRevenue' || card.key === 'pendingDeposits'
                          ? formatCurrency((stats as any)?.[card.key] ?? 0)
                          : ((stats as any)?.[card.key] ?? 0).toLocaleString()}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: 'easeOut' as const, duration: 0.4, delay: 0.3 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline" className="gap-2">
                <Link href="/admin/users">
                  <Users className="size-4" /> Manage Users
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <Link href="/admin/deposits">
                  <DollarSign className="size-4" /> Manage Deposits
                </Link>
              </Button>
              <Button asChild className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                <Link href="/admin/services">
                  <Zap className="size-4" /> Add Service
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: 'easeOut' as const, duration: 0.4, delay: 0.4 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recent Orders</CardTitle>
              <Button asChild variant="ghost" size="sm" className="gap-1 text-indigo-600 hover:text-indigo-700">
                <Link href="/admin/orders">View All <ArrowRight className="size-3" /></Link>
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : recentOrders.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No recent orders</p>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Charge</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}</TableCell>
                          <TableCell className="text-sm truncate max-w-[120px]">{order.userEmail}</TableCell>
                          <TableCell className="text-sm truncate max-w-[140px]">{order.service?.name || '-'}</TableCell>
                          <TableCell><StatusBadge status={order.status} /></TableCell>
                          <TableCell className="text-sm font-medium">{formatCurrency(order.charge)}</TableCell>
                          <TableCell className="text-xs text-slate-500">{formatDate(order.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Deposits */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: 'easeOut' as const, duration: 0.4, delay: 0.5 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recent Deposits</CardTitle>
              <Button asChild variant="ghost" size="sm" className="gap-1 text-indigo-600 hover:text-indigo-700">
                <Link href="/admin/deposits">View All <ArrowRight className="size-3" /></Link>
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : recentDeposits.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No recent deposits</p>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentDeposits.map((dep) => (
                        <TableRow key={dep.id}>
                          <TableCell className="font-mono text-xs">{dep.id.slice(0, 8)}</TableCell>
                          <TableCell className="text-sm truncate max-w-[120px]">{dep.user?.name || dep.user?.email || '-'}</TableCell>
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
        </motion.div>
      </div>
    </div>
  );
}

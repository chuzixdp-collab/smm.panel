'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Wallet,
  ShoppingCart,
  ClipboardList,
  Clock,
  ArrowRight,
  Plus,
  Layers,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/status-badge';
import { formatCurrency, timeAgo, truncate } from '@/lib/utils';

interface UserInfo {
  id: string;
  name: string;
  email: string;
  balance: number;
  totalSpent: number;
}

interface Order {
  id: string;
  targetUrl: string;
  quantity: number;
  charge: number;
  status: string;
  createdAt: string;
  service: {
    id: string;
    name: string;
    platform: string;
  } | null;
}

interface OrderStats {
  total: number;
  pending: number;
  completed: number;
}

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' as const },
  }),
};

function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-7 w-28" />
              </div>
              <Skeleton className="h-12 w-12 rounded-xl" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function OrdersTableSkeleton() {
  return (
    <Card className="border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-24" />
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-slate-50">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [stats, setStats] = useState<OrderStats>({ total: 0, pending: 0, completed: 0 });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [meRes, ordersRes, statsRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/orders?limit=5'),
        fetch('/api/orders?limit=1&page=1'),
      ]);

      if (meRes.ok) {
        const meJson = await meRes.json();
        const u = meJson.data;
        setUser({
          id: u.id,
          name: u.name || 'User',
          email: u.email || '',
          balance: u.balance ?? 0,
          totalSpent: u.totalSpent ?? 0,
        });
      }

      if (ordersRes.ok) {
        const ordersJson = await ordersRes.json();
        setRecentOrders(ordersJson.data?.orders || []);
      }

      // Fetch total and pending counts
      const pendingRes = await fetch('/api/orders?limit=1&status=PENDING');
      const completedRes = await fetch('/api/orders?limit=1&status=COMPLETED');
      let total = 0;
      let pending = 0;
      let completed = 0;
      if (ordersRes.ok) {
        const ordersData = ordersRes.ok ? (await ordersRes.json().catch(() => ({ data: {} }))) : { data: {} };
        // Use the total from the main orders call
      }
      if (pendingRes.ok) {
        const pJson = await pendingRes.json();
        pending = pJson.data?.total || 0;
      }
      if (completedRes.ok) {
        const cJson = await completedRes.json();
        completed = cJson.data?.total || 0;
      }
      // Re-fetch orders to get total count properly
      const allOrdersRes = await fetch('/api/orders?limit=1');
      if (allOrdersRes.ok) {
        const allJson = await allOrdersRes.json();
        total = allJson.data?.total || 0;
      }
      setStats({ total, pending, completed });
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const statCards = [
    {
      label: 'Balance',
      value: user ? formatCurrency(user.balance) : '$0.00',
      icon: Wallet,
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      label: 'Total Orders',
      value: stats.total.toLocaleString(),
      icon: ClipboardList,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Total Spent',
      value: user ? formatCurrency(user.totalSpent) : '$0.00',
      icon: ShoppingCart,
      color: 'bg-green-50 text-green-600',
    },
    {
      label: 'Pending Orders',
      value: stats.pending.toLocaleString(),
      icon: Clock,
      color: 'bg-amber-50 text-amber-600',
    },
  ];

  const quickActions = [
    {
      label: 'New Order',
      href: '/dashboard/new-order',
      icon: Plus,
      color: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    },
    {
      label: 'Add Funds',
      href: '/dashboard/add-funds',
      icon: Wallet,
      color: 'bg-green-600 hover:bg-green-700 text-white',
    },
    {
      label: 'Mass Order',
      href: '/dashboard/mass-order',
      icon: Layers,
      color: 'bg-purple-600 hover:bg-purple-700 text-white',
    },
    {
      label: 'View Services',
      href: '/dashboard/services',
      icon: ClipboardList,
      color: 'bg-amber-500 hover:bg-amber-600 text-white',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {user?.name || 'User'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Here&apos;s what&apos;s happening with your account today.
        </p>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                custom={i}
                variants={cardVariant}
                initial="hidden"
                animate="visible"
              >
                <Card className="border-slate-200">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500">{s.label}</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
                          {s.value}
                        </p>
                      </div>
                      <div className={`rounded-xl p-3 ${s.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((a) => {
          const Icon = a.icon;
          return (
            <Link key={a.href} href={a.href}>
              <Card className="group cursor-pointer border-slate-200 transition-all hover:shadow-md">
                <CardContent className="flex items-center gap-3 p-5">
                  <div className={`rounded-lg p-2.5 ${a.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{a.label}</p>
                    <p className="text-xs text-slate-500">Click to proceed</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Recent Orders */}
      {loading ? (
        <OrdersTableSkeleton />
      ) : (
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-base font-semibold">Recent Orders</CardTitle>
            <Link href="/dashboard/orders">
              <Button variant="ghost" size="sm" className="text-indigo-600 text-xs">
                View All <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-slate-100 p-4">
                  <ClipboardList className="h-8 w-8 text-slate-400" />
                </div>
                <p className="mt-3 text-sm font-medium text-slate-500">No orders yet</p>
                <p className="mt-1 text-xs text-slate-400">Place your first order to get started</p>
                <Link href="/dashboard/new-order" className="mt-4">
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="mr-1.5 h-4 w-4" /> New Order
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 border-y border-slate-100 bg-slate-50/80 backdrop-blur-sm">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-slate-500">ID</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-500">Service</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-500">Link</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-500">Quantity</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-500">Charge</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-500">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order) => (
                        <tr
                          key={order.id}
                          className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer transition-colors"
                          onClick={() => {
                            window.location.href = `/dashboard/order/${order.id}`;
                          }}
                        >
                          <td className="px-4 py-3 font-mono text-xs text-slate-600">
                            #{order.id.slice(0, 8)}
                          </td>
                          <td className="px-4 py-3 text-slate-900 max-w-[200px] truncate">
                            {order.service?.name || '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-500 max-w-[180px] truncate">
                            {order.targetUrl ? (
                              <span className="inline-flex items-center gap-1">
                                {truncate(order.targetUrl, 30)}
                                <ExternalLink className="h-3 w-3 flex-shrink-0" />
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600 tabular-nums">
                            {order.quantity.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-900 font-medium tabular-nums">
                            {formatCurrency(order.charge)}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={order.status} />
                          </td>
                          <td className="px-4 py-3 text-right text-slate-500 text-xs whitespace-nowrap">
                            {timeAgo(order.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-slate-100 max-h-96 overflow-y-auto">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/50 cursor-pointer"
                      onClick={() => {
                        window.location.href = `/dashboard/order/${order.id}`;
                      }}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {order.service?.name || '—'}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          #{order.id.slice(0, 8)} · {order.quantity.toLocaleString()} qty
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <StatusBadge status={order.status} />
                        <span className="text-sm font-medium text-slate-900 tabular-nums">
                          {formatCurrency(order.charge)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

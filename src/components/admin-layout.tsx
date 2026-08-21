'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Users,
  Package,
  Server,
  ClipboardList,
  Banknote,
  ArrowLeftRight,
  CreditCard,
  LayoutGrid,
  UserCheck,
  MessageSquare,
  Bell,
  Key,
  Settings,
  FileText,
  ArrowLeft,
  Menu,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  divider?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: BarChart3 },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Services', href: '/admin/services', icon: Package },
  { label: 'Providers', href: '/admin/providers', icon: Server },
  { label: 'Orders', href: '/admin/orders', icon: ClipboardList },
  { label: 'Deposits', href: '/admin/deposits', icon: Banknote },
  { label: 'Transactions', href: '/admin/transactions', icon: ArrowLeftRight },
  { label: 'Payment Settings', href: '/admin/payment-settings', icon: CreditCard },
  { label: 'Child Panels', href: '/admin/child-panels', icon: LayoutGrid },
  { label: 'Affiliates', href: '/admin/affiliates', icon: UserCheck },
  { label: 'Tickets', href: '/admin/tickets', icon: MessageSquare },
  { label: 'Notifications', href: '/admin/notifications', icon: Bell },
  { label: 'API Management', href: '/admin/api', icon: Key },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
  { label: 'Audit Logs', href: '/admin/audit-logs', icon: FileText },
  { label: '', href: '', icon: ArrowLeft, divider: true },
  { label: 'Back to Site', href: '/', icon: ArrowLeft },
];

interface AdminInfo {
  name: string;
  email: string;
}

function SidebarContent({
  unreadCount,
  adminInfo,
  onNavClick,
}: {
  unreadCount: number;
  adminInfo: AdminInfo | null;
  onNavClick?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch {
      router.push('/login');
    }
  };

  const items = navItems.map((item) => {
    if (item.label === 'Notifications' && unreadCount > 0) {
      return { ...item, badge: unreadCount };
    }
    return item;
  });

  return (
    <div className="flex h-full flex-col">
      {/* Admin badge + Logo */}
      <div className="flex flex-col">
        {/* Indigo accent bar at top */}
        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-500" />
        <div className="flex h-16 items-center gap-3 px-5">
          <Link href="/admin" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="ADNAN SMM Panel"
              width={120}
              height={65}
              className="h-[40px] w-auto"
              priority
            />
          </Link>
          <span className="ml-auto flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600">
            <ShieldCheck className="size-3" />
            Admin
          </span>
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-3">
        <nav className="flex flex-col gap-0.5" role="navigation" aria-label="Admin navigation">
          {items.map((item, index) => {
            // Divider
            if (item.divider) {
              return <Separator key={`divider-${index}`} className="my-2" />;
            }

            // Back to Site - special styling
            const isBackToSite = item.label === 'Back to Site';
            const isActive = !isBackToSite && (pathname === item.href || pathname?.startsWith(item.href + '/'));
            const Icon = item.icon;

            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                onClick={onNavClick}
                className={cn(
                  'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isBackToSite
                    ? 'text-slate-400 hover:bg-gray-50 hover:text-slate-600'
                    : isActive
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-slate-600 hover:bg-gray-50 hover:text-slate-900'
                )}
              >
                {/* Active left border indicator */}
                {isActive && (
                  <motion.div
                    layoutId="adminActiveIndicator"
                    className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-indigo-600"
                    transition={{ type: 'spring', stiffness: 350, damping: 30, ease: 'easeOut' as const }}
                  />
                )}
                <Icon
                  className={cn(
                    'size-[18px] shrink-0 transition-colors duration-200',
                    isBackToSite
                      ? 'text-slate-300 group-hover:text-slate-500'
                      : isActive
                        ? 'text-indigo-600'
                        : 'text-slate-400 group-hover:text-slate-600'
                  )}
                />
                <span className="flex-1">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator />

      {/* Admin info at bottom */}
      <div className="p-4">
        <div className="rounded-lg bg-gray-50/80 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <ShieldCheck className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {adminInfo?.name || 'Loading...'}
              </p>
              <p className="truncate text-xs text-slate-500">
                {adminInfo?.email || ''}
              </p>
            </div>
          </div>
        </div>

        {/* Logout button */}
        <Button
          variant="ghost"
          className="mt-2 w-full justify-start gap-3 text-slate-500 hover:bg-red-50 hover:text-red-600"
          onClick={handleLogout}
        >
          <LogOut className="size-[18px]" />
          <span className="text-sm">Logout</span>
        </Button>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Auth check
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        window.location.href = '/login';
        return;
      }
      const meData = await meRes.json();
      setAdminInfo({
        name: meData.name || meData.user?.name || 'Admin',
        email: meData.email || meData.user?.email || '',
      });

      // Unread notifications
      try {
        const notifRes = await fetch('/api/notifications/unread-count');
        if (notifRes.ok) {
          const notifData = await notifRes.json();
          setUnreadCount(notifData.count ?? notifData.unreadCount ?? 0);
        }
      } catch {
        // Silently fail
      }
    } catch {
      window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50/50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex h-screen w-[280px] flex-col border-r border-gray-200 bg-white">
        <SidebarContent
          unreadCount={unreadCount}
          adminInfo={adminInfo}
        />
      </aside>

      {/* Mobile Top Bar */}
      <div className="flex flex-1 flex-col lg:hidden">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-slate-600">
                <Menu className="size-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Admin Navigation</SheetTitle>
              </SheetHeader>
              <SidebarContent
                unreadCount={unreadCount}
                adminInfo={adminInfo}
                onNavClick={() => setMobileOpen(false)}
              />
            </SheetContent>
          </Sheet>

          <Link href="/admin" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="ADNAN SMM Panel"
              width={120}
              height={65}
              className="h-[32px] w-auto"
            />
            <span className="flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-indigo-600">
              <ShieldCheck className="size-2.5" />
              Admin
            </span>
          </Link>

          <Link
            href="/admin/notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-gray-50 hover:text-slate-700 transition-colors"
          >
            <Bell className="size-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
            <span className="sr-only">Notifications</span>
          </Link>
        </header>

        {/* Mobile Content */}
        <main className="flex-1 overflow-auto bg-gray-50/50">
          {children}
        </main>
      </div>

      {/* Desktop Content */}
      <main className="hidden lg:flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-auto bg-gray-50/50">
          {children}
        </div>
      </main>
    </div>
  );
}

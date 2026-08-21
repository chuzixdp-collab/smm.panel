'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ShoppingCart,
  Package,
  ClipboardList,
  Wallet,
  Layers,
  Key,
  MessageSquare,
  Users,
  LayoutGrid,
  Bell,
  UserCircle,
  LogOut,
  Menu,
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
}

const navItems: NavItem[] = [
  { label: 'New Order', href: '/dashboard/new-order', icon: ShoppingCart },
  { label: 'Services', href: '/dashboard/services', icon: Package },
  { label: 'Orders', href: '/dashboard/orders', icon: ClipboardList },
  { label: 'Add Funds', href: '/dashboard/add-funds', icon: Wallet },
  { label: 'Mass Order', href: '/dashboard/mass-order', icon: Layers },
  { label: 'API', href: '/dashboard/api', icon: Key },
  { label: 'Tickets', href: '/dashboard/tickets', icon: MessageSquare },
  { label: 'Affiliates', href: '/dashboard/affiliates', icon: Users },
  { label: 'Child Panel', href: '/dashboard/child-panel', icon: LayoutGrid },
  { label: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  { label: 'Profile', href: '/dashboard/profile', icon: UserCircle },
];

interface UserInfo {
  name: string;
  email: string;
  balance: number;
}

function SidebarContent({
  unreadCount,
  userInfo,
  onNavClick,
}: {
  unreadCount: number;
  userInfo: UserInfo | null;
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
      {/* Logo */}
      <div className="flex h-16 items-center px-5">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="ADNAN SMM Panel"
            width={120}
            height={65}
            className="h-[40px] w-auto"
            priority
          />
        </Link>
      </div>

      <Separator />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-3">
        <nav className="flex flex-col gap-0.5" role="navigation" aria-label="Main navigation">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavClick}
                className={cn(
                  'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-slate-600 hover:bg-gray-50 hover:text-slate-900'
                )}
              >
                {/* Active left border indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-indigo-600"
                    transition={{ type: 'spring', stiffness: 350, damping: 30, ease: 'easeOut' as const }}
                  />
                )}
                <Icon
                  className={cn(
                    'size-[18px] shrink-0 transition-colors duration-200',
                    isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
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

      {/* User info at bottom */}
      <div className="p-4">
        <div className="rounded-lg bg-gray-50/80 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <UserCircle className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {userInfo?.name || 'Loading...'}
              </p>
              <p className="truncate text-xs text-slate-500">
                {userInfo?.email || ''}
              </p>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between rounded-md bg-white px-3 py-2 border border-gray-100">
            <span className="text-xs text-slate-500">Balance</span>
            <span className="text-sm font-bold text-slate-900 tabular-nums">
              ${(userInfo?.balance ?? 0).toFixed(2)}
            </span>
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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
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
      setUserInfo({
        name: meData.name || meData.user?.name || 'User',
        email: meData.email || meData.user?.email || '',
        balance: meData.balance ?? meData.user?.balance ?? 0,
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
          userInfo={userInfo}
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
                <SheetTitle>Navigation Menu</SheetTitle>
              </SheetHeader>
              <SidebarContent
                unreadCount={unreadCount}
                userInfo={userInfo}
                onNavClick={() => setMobileOpen(false)}
              />
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="ADNAN SMM Panel"
              width={120}
              height={65}
              className="h-[32px] w-auto"
            />
          </Link>

          <Link
            href="/dashboard/notifications"
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

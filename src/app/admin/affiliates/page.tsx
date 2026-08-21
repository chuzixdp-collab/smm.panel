'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  DollarSign,
  Clock,
  ChevronLeft,
  ChevronRight,
  Save,
  Loader2,
  Inbox,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/status-badge';
import { toast } from 'sonner';

interface AffiliateSettings {
  enabled: boolean;
  commissionPercentage: number;
  minimumPayout: number;
}

interface AffiliateStats {
  totalAffiliates: number;
  totalCommissionPaid: number;
  pendingPayouts: number;
}

interface Referral {
  id: string;
  referrer?: { email: string };
  referred?: { email: string };
  commissionEarned: number;
  status: string;
  createdAt: string;
}

const ITEMS_PER_PAGE = 20;

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { ease: 'easeOut' as const, duration: 0.3 } },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
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

export default function AffiliatesPage() {
  const [settings, setSettings] = useState<AffiliateSettings>({ enabled: false, commissionPercentage: 5, minimumPayout: 50 });
  const [stats, setStats] = useState<AffiliateStats>({ totalAffiliates: 0, totalCommissionPaid: 0, pendingPayouts: 0 });
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/affiliates');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
        if (data.stats) setStats(data.stats);
        setReferrals(data.referrals || data.data || []);
        setTotalPages(data.totalPages || Math.ceil((data.totalReferrals || 0) / ITEMS_PER_PAGE) || 1);
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

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        toast.success('Affiliate settings saved successfully');
      } else {
        toast.error('Failed to save settings');
      }
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: 'easeOut' as const, duration: 0.3 }}>
        <h1 className="text-2xl font-bold text-slate-900">Affiliate Program</h1>
        <p className="text-sm text-slate-500 mt-1">Manage affiliate settings and track referrals</p>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        {/* Settings Card */}
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Affiliate Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Affiliate Program</Label>
                  <p className="text-xs text-slate-400 mt-0.5">Allow users to earn commission by referring others</p>
                </div>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(checked) => setSettings((p) => ({ ...p, enabled: checked }))}
                />
              </div>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Commission Percentage (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={settings.commissionPercentage}
                    onChange={(e) => setSettings((p) => ({ ...p, commissionPercentage: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Minimum Payout ($)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={settings.minimumPayout}
                    onChange={(e) => setSettings((p) => ({ ...p, minimumPayout: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <Button
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={handleSaveSettings}
                disabled={saving}
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Overview */}
        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-indigo-500">
            <CardContent className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                <Users className="size-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Affiliates</p>
                <p className="text-2xl font-bold text-slate-900">
                  {loading ? <Skeleton className="h-7 w-12" /> : (stats.totalAffiliates ?? 0).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <DollarSign className="size-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Commission Paid</p>
                <p className="text-2xl font-bold text-slate-900">
                  {loading ? <Skeleton className="h-7 w-20" /> : formatCurrency(stats.totalCommissionPaid)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                <Clock className="size-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Pending Payouts</p>
                <p className="text-2xl font-bold text-slate-900">
                  {loading ? <Skeleton className="h-7 w-20" /> : formatCurrency(stats.pendingPayouts)}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Referral Table */}
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Referral Tree</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : referrals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <Inbox className="size-12 mb-3" />
                  <p className="text-sm font-medium">No referrals yet</p>
                </div>
              ) : (
                <>
                  <div className="max-h-[400px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Referrer</TableHead>
                          <TableHead>Referred</TableHead>
                          <TableHead className="text-right">Commission Earned</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {referrals.map((ref) => (
                          <TableRow key={ref.id}>
                            <TableCell className="text-sm truncate max-w-[180px]">{ref.referrer?.email || '-'}</TableCell>
                            <TableCell className="text-sm truncate max-w-[180px]">{ref.referred?.email || '-'}</TableCell>
                            <TableCell className="text-sm font-medium text-emerald-600 text-right">{formatCurrency(ref.commissionEarned)}</TableCell>
                            <TableCell><StatusBadge status={ref.status} /></TableCell>
                            <TableCell className="text-xs text-slate-500">{formatDate(ref.createdAt)}</TableCell>
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
      </motion.div>
    </div>
  );
}
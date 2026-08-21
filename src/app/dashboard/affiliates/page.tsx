'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  UserCheck,
  DollarSign,
  Clock,
  Copy,
  Check,
  Link2,
  Share2,
  AlertCircle,
  Info,
  MessageCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/status-badge';
import { formatCurrency, timeAgo } from '@/lib/utils';
import { toast } from 'sonner';

interface AffiliateData {
  enabled: boolean;
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  activeReferrals: number;
  totalCommission: number;
  pendingPayout: number;
  commissionRate: number;
}

interface Commission {
  id: string;
  orderId: string;
  amount: number;
  status: string;
  createdAt: string;
}

function AffiliatesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-20 rounded-xl" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default function AffiliatesPage() {
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [affRes, comRes] = await Promise.all([
        fetch('/api/affiliates'),
        fetch('/api/affiliates/commissions'),
      ]);

      if (affRes.ok) {
        const json = await affRes.json();
        const data = json.data || json;
        setAffiliate(data);
      }

      if (comRes.ok) {
        const json = await comRes.json();
        setCommissions(json.data?.commissions || json.data || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const copyReferralLink = () => {
    if (affiliate?.referralLink) {
      navigator.clipboard.writeText(affiliate.referralLink);
      setCopied(true);
      toast.success('Referral link copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareWhatsApp = () => {
    if (!affiliate?.referralLink) return;
    const text = `Join ADNAN SMM Panel and get great social media services! Use my referral link: ${affiliate.referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareTwitter = () => {
    if (!affiliate?.referralLink) return;
    const text = `Check out ADNAN SMM Panel for social media marketing services! ${affiliate.referralLink}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Disabled state
  if (!loading && (!affiliate || !affiliate.enabled)) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Affiliates</h1>
          <p className="mt-1 text-sm text-slate-500">Refer friends and earn commission</p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' as const }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="rounded-full bg-slate-100 p-6">
            <AlertCircle className="h-10 w-10 text-slate-400" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">Affiliate program is currently unavailable</h2>
          <p className="mt-2 text-sm text-slate-500 max-w-md">
            The affiliate program is temporarily disabled. Please check back later.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Affiliates</h1>
        <p className="mt-1 text-sm text-slate-500">Refer friends and earn commission</p>
      </div>

      {loading ? (
        <AffiliatesSkeleton />
      ) : (
        <div className="space-y-6">
          {/* Referral Link Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' as const }}
          >
            <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-slate-900">Your Referral Link</h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Share this link to earn <span className="font-medium text-indigo-600">{affiliate?.commissionRate || 5}%</span> commission on every order
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <code className="rounded-lg bg-white border border-slate-200 px-3 py-2 text-sm font-mono text-slate-800 max-w-[400px] truncate">
                        {affiliate?.referralLink}
                      </code>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={copyReferralLink}
                      >
                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      Referral code: <span className="font-mono font-medium text-slate-600">{affiliate?.referralCode}</span>
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={shareWhatsApp}>
                      <MessageCircle className="h-4 w-4" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={shareTwitter}>
                      <Share2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Share</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: 'Total Referrals',
                value: affiliate?.totalReferrals || 0,
                icon: <Users className="h-5 w-5 text-indigo-500" />,
                bg: 'bg-indigo-50',
              },
              {
                label: 'Active Referrals',
                value: affiliate?.activeReferrals || 0,
                icon: <UserCheck className="h-5 w-5 text-green-500" />,
                bg: 'bg-green-50',
              },
              {
                label: 'Total Commission',
                value: formatCurrency(affiliate?.totalCommission || 0),
                icon: <DollarSign className="h-5 w-5 text-yellow-500" />,
                bg: 'bg-yellow-50',
              },
              {
                label: 'Pending Payout',
                value: formatCurrency(affiliate?.pendingPayout || 0),
                icon: <Clock className="h-5 w-5 text-orange-500" />,
                bg: 'bg-orange-50',
              },
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' as const, delay: 0.05 * idx }}
              >
                <Card className="border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg}`}>
                        {stat.icon}
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-900 mt-3 tabular-nums">{stat.value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Commission Info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' as const, delay: 0.25 }}
          >
            <Card className="border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-slate-600">
                    <p className="font-medium text-slate-800">How it works</p>
                    <p className="mt-1">
                      You earn <span className="font-semibold text-indigo-600">{affiliate?.commissionRate || 5}%</span> commission on every order placed by your referred users. Commissions are credited to your balance when the referred user's order is completed.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Commission History */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' as const, delay: 0.3 }}
          >
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-900">Commission History</CardTitle>
                <CardDescription>
                  {commissions.length > 0
                    ? `${commissions.length} commission${commissions.length !== 1 ? 's' : ''}`
                    : 'No commissions yet'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {commissions.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <DollarSign className="h-8 w-8 text-slate-300" />
                    <p className="mt-2 text-sm text-slate-500">No commissions earned yet</p>
                    <p className="text-xs text-slate-400 mt-1">Share your referral link to start earning</p>
                  </div>
                ) : (
                  <>
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                            <TableHead className="text-slate-500">ID</TableHead>
                            <TableHead className="text-slate-500">Order ID</TableHead>
                            <TableHead className="text-right text-slate-500">Amount</TableHead>
                            <TableHead className="text-slate-500">Status</TableHead>
                            <TableHead className="text-right text-slate-500">Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {commissions.map((com) => (
                            <TableRow key={com.id}>
                              <TableCell className="font-mono text-xs text-slate-500">
                                #{com.id.slice(0, 8)}
                              </TableCell>
                              <TableCell className="font-mono text-xs text-slate-600">
                                #{com.orderId?.slice(0, 8) || com.orderId}
                              </TableCell>
                              <TableCell className="text-right text-sm font-medium text-slate-900 tabular-nums">
                                {formatCurrency(com.amount)}
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={com.status} />
                              </TableCell>
                              <TableCell className="text-right text-xs text-slate-500">
                                {timeAgo(com.createdAt)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile */}
                    <div className="md:hidden divide-y divide-slate-100">
                      {commissions.map((com) => (
                        <div key={com.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs text-slate-500">#{com.id.slice(0, 8)}</span>
                            <StatusBadge status={com.status} />
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-slate-400">Order #{com.orderId?.slice(0, 8)}</span>
                            <span className="text-sm font-medium text-slate-900 tabular-nums">
                              {formatCurrency(com.amount)}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400 mt-1 block">{timeAgo(com.createdAt)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}

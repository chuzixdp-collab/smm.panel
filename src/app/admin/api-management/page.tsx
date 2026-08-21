'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Key,
  Ban,
  Inbox,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { StatusBadge } from '@/components/status-badge';
import { toast } from 'sonner';

interface ApiKey {
  id: string;
  user?: { email: string };
  keyPrefix: string;
  key: string;
  status: string;
  lastUsed?: string;
  createdAt: string;
  usageCount: number;
}

const ITEMS_PER_PAGE = 20;

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { ease: 'easeOut' as const, duration: 0.3 } },
};

function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function maskKey(key: string) {
  if (!key || key.length <= 12) return '****';
  return key.slice(0, 8) + '****' + key.slice(-4);
}

export default function ApiManagementPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Revoke dialog
  const [revokeKey, setRevokeKey] = useState<ApiKey | null>(null);
  const [revoking, setRevoking] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(ITEMS_PER_PAGE) });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/api-keys?${params}`);
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data.apiKeys || data.data || data.keys || []);
        setTotalPages(data.totalPages || Math.ceil((data.total || 0) / ITEMS_PER_PAGE) || 1);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRevoke = async () => {
    if (!revokeKey) return;
    setRevoking(true);
    try {
      const res = await fetch(`/api/admin/api-keys/${revokeKey.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('API key revoked successfully');
        setRevokeKey(null);
        fetchData();
      } else {
        toast.error('Failed to revoke API key');
      }
    } catch {
      toast.error('Failed to revoke API key');
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: 'easeOut' as const, duration: 0.3 }}>
        <h1 className="text-2xl font-bold text-slate-900">API Management</h1>
        <p className="text-sm text-slate-500 mt-1">Manage API keys across the platform</p>
      </motion.div>

      <motion.div variants={fadeIn} initial="hidden" animate="show">
        <Card>
          <CardContent className="pt-6 space-y-4">
            {/* Search */}
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                placeholder="Search by email or key prefix..."
                className="pl-9"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Inbox className="size-12 mb-3" />
                <p className="text-sm font-medium">No API keys found</p>
              </div>
            ) : (
              <>
                <div className="max-h-[520px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Key Prefix</TableHead>
                        <TableHead>Key</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Used</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Usage</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {apiKeys.map((apiKey) => (
                        <TableRow key={apiKey.id}>
                          <TableCell className="text-sm truncate max-w-[160px]">{apiKey.user?.email || '-'}</TableCell>
                          <TableCell className="font-mono text-xs">{apiKey.keyPrefix || apiKey.key?.slice(0, 8) || '-'}</TableCell>
                          <TableCell className="font-mono text-xs text-slate-500">{maskKey(apiKey.key)}</TableCell>
                          <TableCell>
                            <StatusBadge status={apiKey.status} />
                          </TableCell>
                          <TableCell className="text-xs text-slate-500 whitespace-nowrap">{formatDate(apiKey.lastUsed || '')}</TableCell>
                          <TableCell className="text-xs text-slate-500 whitespace-nowrap">{formatDate(apiKey.createdAt)}</TableCell>
                          <TableCell className="text-sm text-right font-medium">{(apiKey.usageCount ?? 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            {apiKey.status === 'ACTIVE' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-600"
                                onClick={() => setRevokeKey(apiKey)}
                              >
                                <Ban className="size-4 mr-1" /> Revoke
                              </Button>
                            )}
                          </TableCell>
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

      {/* Revoke Confirmation */}
      <AlertDialog open={!!revokeKey} onOpenChange={(open) => !open && setRevokeKey(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke the API key for {revokeKey?.user?.email || 'this user'}? This action cannot be undone and any integrations using this key will stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevoke} disabled={revoking} className="bg-destructive text-white hover:bg-destructive/90">
              {revoking && <Loader2 className="size-4 animate-spin mr-1" />}
              Revoke Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
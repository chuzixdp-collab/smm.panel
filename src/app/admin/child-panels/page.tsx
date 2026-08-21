'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Pencil,
  Ban,
  CheckCircle2,
  Trash2,
  Inbox,
  Loader2,
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { StatusBadge } from '@/components/status-badge';
import { toast } from 'sonner';

interface ChildPanel {
  id: string;
  name: string;
  owner?: { email: string };
  slug: string;
  domain?: string;
  markup: number;
  status: string;
  usersCount?: number;
  ordersCount?: number;
  revenue?: number;
  title?: string;
  supportInfo?: string;
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
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ChildPanelsPage() {
  const router = useRouter();
  const [panels, setPanels] = useState<ChildPanel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Edit dialog
  const [editPanel, setEditPanel] = useState<ChildPanel | null>(null);
  const [editForm, setEditForm] = useState({ name: '', title: '', markup: 0, status: 'ACTIVE', domain: '', supportInfo: '' });
  const [saving, setSaving] = useState(false);

  // Delete dialog
  const [deletePanel, setDeletePanel] = useState<ChildPanel | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(ITEMS_PER_PAGE) });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/child-panels?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPanels(data.panels || data.data || []);
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

  const openEdit = (panel: ChildPanel) => {
    setEditPanel(panel);
    setEditForm({
      name: panel.name,
      title: panel.title || '',
      markup: panel.markup,
      status: panel.status,
      domain: panel.domain || '',
      supportInfo: panel.supportInfo || '',
    });
  };

  const handleEditSave = async () => {
    if (!editPanel) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/child-panels/${editPanel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        toast.success('Panel updated successfully');
        setEditPanel(null);
        fetchData();
      } else {
        toast.error('Failed to update panel');
      }
    } catch {
      toast.error('Failed to update panel');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (panel: ChildPanel) => {
    try {
      const newStatus = panel.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
      const res = await fetch(`/api/admin/child-panels/${panel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(`Panel ${newStatus === 'ACTIVE' ? 'activated' : 'suspended'}`);
        fetchData();
      } else {
        toast.error('Failed to update panel status');
      }
    } catch {
      toast.error('Failed to update panel status');
    }
  };

  const handleDelete = async () => {
    if (!deletePanel) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/child-panels/${deletePanel.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Panel deleted successfully');
        setDeletePanel(null);
        fetchData();
      } else {
        toast.error('Failed to delete panel');
      }
    } catch {
      toast.error('Failed to delete panel');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: 'easeOut' as const, duration: 0.3 }}>
        <h1 className="text-2xl font-bold text-slate-900">Child Panels</h1>
        <p className="text-sm text-slate-500 mt-1">Manage all child panels and their configurations</p>
      </motion.div>

      <motion.div variants={fadeIn} initial="hidden" animate="show">
        <Card>
          <CardContent className="pt-6 space-y-4">
            {/* Search */}
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                placeholder="Search panels..."
                className="pl-9"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : panels.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Inbox className="size-12 mb-3" />
                <p className="text-sm font-medium">No child panels found</p>
              </div>
            ) : (
              <>
                <div className="max-h-[520px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Domain</TableHead>
                        <TableHead>Markup %</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Users</TableHead>
                        <TableHead className="text-right">Orders</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {panels.map((panel) => (
                        <TableRow key={panel.id}>
                          <TableCell className="font-medium text-sm">{panel.name}</TableCell>
                          <TableCell className="text-sm truncate max-w-[150px]">{panel.owner?.email || '-'}</TableCell>
                          <TableCell className="font-mono text-xs">{panel.slug}</TableCell>
                          <TableCell className="text-sm truncate max-w-[120px]">{panel.domain || '-'}</TableCell>
                          <TableCell className="text-sm font-medium">{panel.markup}%</TableCell>
                          <TableCell><StatusBadge status={panel.status} /></TableCell>
                          <TableCell className="text-sm text-right">{(panel.usersCount ?? 0).toLocaleString()}</TableCell>
                          <TableCell className="text-sm text-right">{(panel.ordersCount ?? 0).toLocaleString()}</TableCell>
                          <TableCell className="text-sm text-right font-medium">{formatCurrency(panel.revenue ?? 0)}</TableCell>
                          <TableCell className="text-xs text-slate-500">{formatDate(panel.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8">
                                  <MoreHorizontal className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => router.push(`/admin/child-panels/${panel.id}`)}>
                                  <Eye className="size-4 mr-2" /> View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEdit(panel)}>
                                  <Pencil className="size-4 mr-2" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleStatus(panel)}>
                                  {panel.status === 'ACTIVE' ? <Ban className="size-4 mr-2" /> : <CheckCircle2 className="size-4 mr-2" />}
                                  {panel.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                                </DropdownMenuItem>
                                <DropdownMenuItem variant="destructive" onClick={() => setDeletePanel(panel)}>
                                  <Trash2 className="size-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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

      {/* Edit Dialog */}
      <Dialog open={!!editPanel} onOpenChange={(open) => !open && setEditPanel(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Child Panel</DialogTitle>
            <DialogDescription>Update panel configuration</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={editForm.title} onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Markup (%)</Label>
              <Input type="number" min={0} max={100} value={editForm.markup} onChange={(e) => setEditForm((p) => ({ ...p, markup: Number(e.target.value) }))} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm((p) => ({ ...p, status: v }))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Domain</Label>
              <Input value={editForm.domain} onChange={(e) => setEditForm((p) => ({ ...p, domain: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Support Info</Label>
              <Textarea value={editForm.supportInfo} onChange={(e) => setEditForm((p) => ({ ...p, supportInfo: e.target.value }))} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPanel(null)}>Cancel</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleEditSave} disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletePanel} onOpenChange={(open) => !open && setDeletePanel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Child Panel</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletePanel?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-white hover:bg-destructive/90">
              {deleting && <Loader2 className="size-4 animate-spin mr-1" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
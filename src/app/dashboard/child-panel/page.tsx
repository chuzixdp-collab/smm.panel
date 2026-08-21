'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Globe,
  Edit,
  Users,
  ShoppingCart,
  Palette,
  Loader2,
  Link2,
  HelpCircle,
  Settings,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/status-badge';
import { formatDate, timeAgo } from '@/lib/utils';
import { toast } from 'sonner';

interface ChildPanel {
  id: string;
  name: string;
  slug: string;
  title: string;
  primaryColor: string;
  markupPercentage: number;
  domain: string | null;
  supportInfo: string | null;
  enabled: boolean;
  usersCount: number;
  ordersCount: number;
  createdAt: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function PanelSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="p-4 rounded-xl border border-slate-200">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-9 w-20" />
          </div>
          <div className="flex gap-6 mt-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

const defaultForm = {
  name: '',
  slug: '',
  title: '',
  primaryColor: '#6366f1',
  markupPercentage: 10,
  domain: '',
  supportInfo: '',
};

export default function ChildPanelPage() {
  const [panels, setPanels] = useState<ChildPanel[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPanel, setEditingPanel] = useState<ChildPanel | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(defaultForm);

  const fetchPanels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/child-panel');
      if (res.ok) {
        const json = await res.json();
        setPanels(json.data?.panels || json.data || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPanels();
  }, [fetchPanels]);

  const openCreateDialog = () => {
    setEditingPanel(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEditDialog = (panel: ChildPanel) => {
    setEditingPanel(panel);
    setForm({
      name: panel.name,
      slug: panel.slug,
      title: panel.title,
      primaryColor: panel.primaryColor || '#6366f1',
      markupPercentage: panel.markupPercentage,
      domain: panel.domain || '',
      supportInfo: panel.supportInfo || '',
    });
    setDialogOpen(true);
  };

  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug: editingPanel ? prev.slug : slugify(name),
    }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Panel name is required');
      return;
    }
    if (!form.slug.trim()) {
      toast.error('Slug is required');
      return;
    }
    if (form.markupPercentage < 0) {
      toast.error('Markup must be 0 or more');
      return;
    }

    setSubmitting(true);
    try {
      const url = editingPanel
        ? `/api/child-panel/${editingPanel.id}`
        : '/api/child-panel';
      const method = editingPanel ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        toast.success(editingPanel ? 'Panel updated' : 'Panel created');
        setDialogOpen(false);
        fetchPanels();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to save panel');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleEnabled = async (panel: ChildPanel) => {
    try {
      const res = await fetch(`/api/child-panel/${panel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !panel.enabled }),
      });
      if (res.ok) {
        setPanels((prev) =>
          prev.map((p) => (p.id === panel.id ? { ...p, enabled: !p.enabled } : p))
        );
        toast.success(panel.enabled ? 'Panel disabled' : 'Panel enabled');
      } else {
        toast.error('Failed to toggle panel');
      }
    } catch {
      toast.error('Network error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Child Panels</h1>
          <p className="mt-1 text-sm text-slate-500">
            {panels.length > 0
              ? `${panels.length} panel${panels.length !== 1 ? 's' : ''}`
              : 'Create and manage child panels'}
          </p>
        </div>
        <Button
          className="bg-indigo-600 hover:bg-indigo-700 w-fit"
          onClick={openCreateDialog}
        >
          <Plus className="h-4 w-4" />
          Create Child Panel
        </Button>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPanel ? 'Edit Child Panel' : 'Create Child Panel'}</DialogTitle>
            <DialogDescription>
              {editingPanel
                ? 'Update your child panel settings'
                : 'Set up a new child panel with custom branding'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="panel-name">Panel Name</Label>
                <Input
                  id="panel-name"
                  placeholder="My Panel"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="panel-slug">Slug</Label>
                <Input
                  id="panel-slug"
                  placeholder="my-panel"
                  value={form.slug}
                  onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="panel-title">Site Title</Label>
              <Input
                id="panel-title"
                placeholder="My SMM Panel"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="panel-color">Primary Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.primaryColor}
                    onChange={(e) => setForm((prev) => ({ ...prev, primaryColor: e.target.value }))}
                    className="h-9 w-12 cursor-pointer rounded border border-slate-200"
                  />
                  <Input
                    value={form.primaryColor}
                    onChange={(e) => setForm((prev) => ({ ...prev, primaryColor: e.target.value }))}
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="panel-markup">Markup Percentage (%)</Label>
                <Input
                  id="panel-markup"
                  type="number"
                  min={0}
                  step={0.1}
                  value={form.markupPercentage}
                  onChange={(e) => setForm((prev) => ({ ...prev, markupPercentage: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="panel-domain">Custom Domain (optional)</Label>
              <Input
                id="panel-domain"
                placeholder="panel.example.com"
                value={form.domain}
                onChange={(e) => setForm((prev) => ({ ...prev, domain: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="panel-support">Support Info (optional)</Label>
              <Textarea
                id="panel-support"
                placeholder="Email or support contact info for panel users"
                value={form.supportInfo}
                onChange={(e) => setForm((prev) => ({ ...prev, supportInfo: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              {editingPanel ? 'Save Changes' : 'Create Panel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {loading ? (
        <PanelSkeleton />
      ) : panels.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' as const }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="rounded-full bg-slate-100 p-6">
            <Globe className="h-10 w-10 text-slate-400" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">No child panels yet</h2>
          <p className="mt-2 text-sm text-slate-500 max-w-md">
            Create your first child panel to resell services under your own brand with custom pricing and design.
          </p>
          <Button
            className="mt-4 bg-indigo-600 hover:bg-indigo-700"
            onClick={openCreateDialog}
          >
            <Plus className="h-4 w-4" />
            Create Your First Panel
          </Button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' as const }}
          className="space-y-4"
        >
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Card className="border-slate-200">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                      <TableHead className="text-slate-500">Panel</TableHead>
                      <TableHead className="text-slate-500">Slug</TableHead>
                      <TableHead className="text-slate-500">Status</TableHead>
                      <TableHead className="text-right text-slate-500">Markup</TableHead>
                      <TableHead className="text-right text-slate-500">Users</TableHead>
                      <TableHead className="text-right text-slate-500">Orders</TableHead>
                      <TableHead className="text-right text-slate-500">Created</TableHead>
                      <TableHead className="text-right text-slate-500">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {panels.map((panel) => (
                      <TableRow key={panel.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: panel.primaryColor || '#6366f1' }}
                            />
                            <div>
                              <p className="text-sm font-medium text-slate-900">{panel.name}</p>
                              <p className="text-xs text-slate-400">{panel.title || panel.name}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-500">/{panel.slug}</TableCell>
                        <TableCell>
                          <StatusBadge status={panel.enabled ? 'ACTIVE' : 'INACTIVE'} />
                        </TableCell>
                        <TableCell className="text-right text-sm text-slate-600 tabular-nums">
                          {panel.markupPercentage}%
                        </TableCell>
                        <TableCell className="text-right text-sm text-slate-600 tabular-nums">
                          {panel.usersCount || 0}
                        </TableCell>
                        <TableCell className="text-right text-sm text-slate-600 tabular-nums">
                          {panel.ordersCount || 0}
                        </TableCell>
                        <TableCell className="text-right text-xs text-slate-500">
                          {formatDate(panel.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(panel)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Switch
                              checked={panel.enabled}
                              onCheckedChange={() => toggleEnabled(panel)}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {panels.map((panel) => (
              <Card key={panel.id} className="border-slate-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${panel.primaryColor || '#6366f1'}15` }}
                      >
                        <Globe className="h-4 w-4" style={{ color: panel.primaryColor || '#6366f1' }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{panel.name}</p>
                        <p className="text-xs text-slate-400 font-mono">/{panel.slug}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge status={panel.enabled ? 'ACTIVE' : 'INACTIVE'} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="text-center">
                      <p className="text-xs text-slate-400">Markup</p>
                      <p className="text-sm font-semibold text-slate-900 tabular-nums">{panel.markupPercentage}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-400">Users</p>
                      <p className="text-sm font-semibold text-slate-900 tabular-nums">{panel.usersCount || 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-400">Orders</p>
                      <p className="text-sm font-semibold text-slate-900 tabular-nums">{panel.ordersCount || 0}</p>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Created {formatDate(panel.createdAt)}</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(panel)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Switch
                        checked={panel.enabled}
                        onCheckedChange={() => toggleEnabled(panel)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  MoreHorizontal,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Server,
  Loader2,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { StatusBadge } from '@/components/status-badge';
import { toast } from 'sonner';

interface Provider {
  id: string;
  name: string;
  apiUrl: string;
  apiKey: string;
  currency: string;
  priority: number;
  status: string;
}

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { ease: 'easeOut' as const, duration: 0.3 } },
};

function maskKey(key: string) {
  if (!key) return '-';
  if (key.length <= 8) return '••••••••';
  return key.slice(0, 4) + '••••' + key.slice(-4);
}

const emptyForm = {
  name: '', apiUrl: '', apiKey: '', currency: 'USD', priority: '1',
};

type FormData = typeof emptyForm;

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  // Form dialog
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Provider | null>(null);
  const [form, setForm] = useState<FormData>({ ...emptyForm });
  const [formLoading, setFormLoading] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Provider | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Test connection
  const [testingId, setTestingId] = useState<string | null>(null);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/providers');
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers || data.data || []);
      }
    } catch { toast.error('Failed to load providers'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProviders(); }, [fetchProviders]);

  const openAdd = () => { setEditing(null); setForm({ ...emptyForm }); setFormOpen(true); };

  const openEdit = (p: Provider) => {
    setEditing(p);
    setForm({
      name: p.name || '',
      apiUrl: p.apiUrl || '',
      apiKey: p.apiKey || '',
      currency: p.currency || 'USD',
      priority: String(p.priority || 1),
    });
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.apiUrl || !form.apiKey) {
      toast.error('Please fill required fields');
      return;
    }
    setFormLoading(true);
    try {
      const body = {
        name: form.name,
        apiUrl: form.apiUrl,
        apiKey: form.apiKey,
        currency: form.currency,
        priority: parseInt(form.priority) || 1,
      };
      const url = editing ? `/api/admin/providers/${editing.id}` : '/api/admin/providers';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        toast.success(editing ? 'Provider updated' : 'Provider created');
        setFormOpen(false);
        fetchProviders();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to save');
      }
    } catch { toast.error('Failed to save'); }
    finally { setFormLoading(false); }
  };

  const handleToggle = async (p: Provider) => {
    const newStatus = p.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch(`/api/admin/providers/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) { toast.success(`Provider ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'}`); fetchProviders(); }
      else toast.error('Failed to update');
    } catch { toast.error('Failed to update'); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/providers/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Provider deleted'); setDeleteTarget(null); fetchProviders(); }
      else toast.error('Failed to delete');
    } catch { toast.error('Failed to delete'); }
    finally { setDeleteLoading(false); }
  };

  const handleTest = async (p: Provider) => {
    setTestingId(p.id);
    try {
      const res = await fetch(`/api/admin/providers/${p.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test' }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || 'Connection successful!', { duration: 4000 });
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Connection failed');
      }
    } catch { toast.error('Connection test failed'); }
    finally { setTestingId(null); }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: 'easeOut' as const, duration: 0.3 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Providers</h1>
          <p className="text-sm text-slate-500 mt-1">Manage API service providers</p>
        </div>
        <Button onClick={openAdd} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
          <Plus className="size-4" /> Add Provider
        </Button>
      </motion.div>

      <motion.div variants={fadeIn} initial="hidden" animate="show">
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : providers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Server className="size-12 mb-3" /><p className="text-sm font-medium">No providers found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>API URL</TableHead>
                      <TableHead>API Key</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {providers.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium text-sm">{p.name}</TableCell>
                        <TableCell className="font-mono text-xs text-slate-500 truncate max-w-[180px]">{p.apiUrl || '-'}</TableCell>
                        <TableCell className="font-mono text-xs text-slate-500">{maskKey(p.apiKey)}</TableCell>
                        <TableCell className="text-sm">{p.currency || 'USD'}</TableCell>
                        <TableCell className="text-sm text-center">{p.priority || 1}</TableCell>
                        <TableCell><StatusBadge status={p.status} /></TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8"><MoreHorizontal className="size-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(p)}><Pencil className="size-4" /> Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggle(p)}>
                                {p.status === 'ACTIVE' ? <ToggleRight className="size-4" /> : <ToggleLeft className="size-4" />}
                                {p.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleTest(p)} disabled={testingId === p.id}>
                                {testingId === p.id ? <Loader2 className="size-4 animate-spin" /> : <Wifi className="size-4" />}
                                Test Connection
                              </DropdownMenuItem>
                              <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(p)}><Trash2 className="size-4" /> Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Add/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Provider' : 'Add Provider'}</DialogTitle>
            <DialogDescription>{editing ? 'Update provider settings' : 'Add a new API provider'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="prov-name">Name *</Label>
              <Input id="prov-name" placeholder="Provider name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prov-url">API URL *</Label>
              <Input id="prov-url" placeholder="https://api.example.com/v2" value={form.apiUrl} onChange={(e) => setForm({ ...form, apiUrl: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prov-key">API Key *</Label>
              <Input id="prov-key" type="password" placeholder="Enter API key" value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="INR">INR</SelectItem>
                  <SelectItem value="BDT">BDT</SelectItem>
                  <SelectItem value="TRY">TRY</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prov-priority">Priority</Label>
              <Input id="prov-priority" type="number" placeholder="1" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={formLoading} className="bg-indigo-600 hover:bg-indigo-700">
              {formLoading && <Loader2 className="size-4 animate-spin" />}
              {editing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Provider</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteLoading} className="bg-destructive text-white hover:bg-destructive/90">
              {deleteLoading && <Loader2 className="size-4 animate-spin" />} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

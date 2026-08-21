'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
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

const PLATFORMS = [
  'Instagram', 'TikTok', 'YouTube', 'Facebook', 'Telegram',
  'Twitter', 'Twitch', 'Snapchat', 'Threads', 'Pinterest', 'Reddit', 'LinkedIn',
];

interface Provider {
  id: string;
  name: string;
}

interface Service {
  id: string;
  platform: string;
  category: string;
  name: string;
  description?: string;
  providerCost: number;
  sellingPrice: number;
  resellerPrice?: number;
  minQuantity: number;
  maxQuantity: number;
  refillAvailable: boolean;
  cancelAvailable: boolean;
  providerServiceId?: string;
  provider?: Provider;
  status: string;
}

const ITEMS_PER_PAGE = 15;

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { ease: 'easeOut' as const, duration: 0.3 } },
};

function formatCurrency(amount: number) {
  return `$${amount.toFixed(4)}`;
}

const emptyForm = {
  platform: '', category: '', name: '', description: '', providerId: '',
  providerServiceId: '', providerCost: '', sellingPrice: '', resellerPrice: '',
  minQuantity: '', maxQuantity: '', refillAvailable: false, cancelAvailable: false,
};

type FormData = typeof emptyForm;

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [platforms, setPlatforms] = useState<string[]>([]);

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [form, setForm] = useState<FormData>({ ...emptyForm });
  const [formLoading, setFormLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(ITEMS_PER_PAGE) });
      if (search) params.set('search', search);
      if (platformFilter !== 'ALL') params.set('platform', platformFilter);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      const res = await fetch(`/api/admin/services?${params}`);
      if (res.ok) {
        const data = await res.json();
        setServices(data.services || data.data || []);
        setTotalPages(data.totalPages || Math.ceil((data.total || 0) / ITEMS_PER_PAGE) || 1);
        if (data.platforms) setPlatforms(data.platforms);
      }
    } catch { toast.error('Failed to load services'); }
    finally { setLoading(false); }
  }, [page, search, platformFilter, statusFilter]);

  const fetchProviders = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/providers?limit=200');
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers || data.data || []);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchServices(); fetchProviders(); }, [fetchServices, fetchProviders]);

  const openAddDialog = () => {
    setEditingService(null);
    setForm({ ...emptyForm });
    setFormOpen(true);
  };

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    setForm({
      platform: service.platform || '',
      category: service.category || '',
      name: service.name || '',
      description: service.description || '',
      providerId: service.provider?.id || '',
      providerServiceId: service.providerServiceId || '',
      providerCost: String(service.providerCost || ''),
      sellingPrice: String(service.sellingPrice || ''),
      resellerPrice: String(service.resellerPrice || ''),
      minQuantity: String(service.minQuantity || ''),
      maxQuantity: String(service.maxQuantity || ''),
      refillAvailable: service.refillAvailable || false,
      cancelAvailable: service.cancelAvailable || false,
    });
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.platform || !form.sellingPrice) {
      toast.error('Please fill required fields (Platform, Name, Selling Price)');
      return;
    }
    setFormLoading(true);
    try {
      const body: any = {
        platform: form.platform,
        category: form.category,
        name: form.name,
        description: form.description,
        providerId: form.providerId || null,
        providerServiceId: form.providerServiceId || null,
        providerCost: form.providerCost ? parseFloat(form.providerCost) : null,
        sellingPrice: parseFloat(form.sellingPrice),
        resellerPrice: form.resellerPrice ? parseFloat(form.resellerPrice) : null,
        minQuantity: form.minQuantity ? parseInt(form.minQuantity) : null,
        maxQuantity: form.maxQuantity ? parseInt(form.maxQuantity) : null,
        refillAvailable: form.refillAvailable,
        cancelAvailable: form.cancelAvailable,
      };

      const url = editingService ? `/api/admin/services/${editingService.id}` : '/api/admin/services';
      const method = editingService ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        toast.success(editingService ? 'Service updated' : 'Service created');
        setFormOpen(false);
        fetchServices();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to save service');
      }
    } catch { toast.error('Failed to save service'); }
    finally { setFormLoading(false); }
  };

  const handleToggle = async (service: Service) => {
    const newStatus = service.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch(`/api/admin/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) { toast.success(`Service ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'}`); fetchServices(); }
      else toast.error('Failed to update status');
    } catch { toast.error('Failed to update status'); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/services/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Service deleted'); setDeleteTarget(null); fetchServices(); }
      else toast.error('Failed to delete service');
    } catch { toast.error('Failed to delete service'); }
    finally { setDeleteLoading(false); }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: 'easeOut' as const, duration: 0.3 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Services</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your SMM services</p>
        </div>
        <Button onClick={openAddDialog} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
          <Plus className="size-4" /> Add Service
        </Button>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeIn} initial="hidden" animate="show" className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input placeholder="Search services..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
        </div>
        <Select value={platformFilter} onValueChange={(v) => { setPlatformFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Platform" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Platforms</SelectItem>
            {(platforms.length > 0 ? platforms : PLATFORMS).map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Table */}
      <motion.div variants={fadeIn} initial="hidden" animate="show" transition={{ delay: 0.1 }}>
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : services.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Package className="size-12 mb-3" /><p className="text-sm font-medium">No services found</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Price/1K</TableHead>
                      <TableHead>Min</TableHead>
                      <TableHead>Max</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell className="font-mono text-xs">{service.id.slice(0, 8)}</TableCell>
                        <TableCell className="text-sm">{service.platform}</TableCell>
                        <TableCell className="text-sm text-slate-600">{service.category || '-'}</TableCell>
                        <TableCell className="text-sm font-medium truncate max-w-[180px]">{service.name}</TableCell>
                        <TableCell className="text-sm font-medium text-indigo-600">{formatCurrency(service.sellingPrice)}</TableCell>
                        <TableCell className="text-sm">{service.minQuantity?.toLocaleString()}</TableCell>
                        <TableCell className="text-sm">{service.maxQuantity?.toLocaleString()}</TableCell>
                        <TableCell className="text-sm text-slate-500">{service.provider?.name || '-'}</TableCell>
                        <TableCell><StatusBadge status={service.status} /></TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8"><MoreHorizontal className="size-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(service)}><Pencil className="size-4" /> Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggle(service)}>
                                {service.status === 'ACTIVE' ? <ToggleRight className="size-4" /> : <ToggleLeft className="size-4" />}
                                {service.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                              </DropdownMenuItem>
                              <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(service)}><Trash2 className="size-4" /> Delete</DropdownMenuItem>
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

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="size-4" /></Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="size-4" /></Button>
          </div>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingService ? 'Edit Service' : 'Add Service'}</DialogTitle>
            <DialogDescription>{editingService ? 'Update service details' : 'Create a new service'}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label>Platform *</Label>
              <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select platform" /></SelectTrigger>
                <SelectContent>{PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input placeholder="e.g. Followers" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Name *</Label>
              <Input placeholder="Service name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Description</Label>
              <Textarea placeholder="Service description..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select value={form.providerId} onValueChange={(v) => setForm({ ...form, providerId: v })}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select provider" /></SelectTrigger>
                <SelectContent>{providers.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Provider Service ID</Label>
              <Input placeholder="ID from provider" value={form.providerServiceId} onChange={(e) => setForm({ ...form, providerServiceId: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Provider Cost</Label>
              <Input type="number" step="0.0001" placeholder="0.00" value={form.providerCost} onChange={(e) => setForm({ ...form, providerCost: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Selling Price/1K *</Label>
              <Input type="number" step="0.0001" placeholder="0.00" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Reseller Price/1K</Label>
              <Input type="number" step="0.0001" placeholder="Optional" value={form.resellerPrice} onChange={(e) => setForm({ ...form, resellerPrice: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Min Quantity</Label>
              <Input type="number" placeholder="1" value={form.minQuantity} onChange={(e) => setForm({ ...form, minQuantity: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Max Quantity</Label>
              <Input type="number" placeholder="10000" value={form.maxQuantity} onChange={(e) => setForm({ ...form, maxQuantity: e.target.value })} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.refillAvailable} onCheckedChange={(c) => setForm({ ...form, refillAvailable: c })} />
              <Label>Refill Available</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.cancelAvailable} onCheckedChange={(c) => setForm({ ...form, cancelAvailable: c })} />
              <Label>Cancel Available</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={formLoading} className="bg-indigo-600 hover:bg-indigo-700">
              {formLoading && <Loader2 className="size-4 animate-spin" />}
              {editingService ? 'Update Service' : 'Create Service'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service</AlertDialogTitle>
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

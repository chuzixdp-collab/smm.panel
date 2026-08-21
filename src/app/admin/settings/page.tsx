'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Save,
  Loader2,
  Globe,
  CreditCard,
  Megaphone,
  MessageCircle,
  Headphones,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface SiteSettings {
  // General
  siteName: string;
  currency: string;
  maintenanceMode: boolean;
  // Payment
  minDeposit: number;
  // Announcement
  announcementText: string;
  announcementEnabled: boolean;
  // WhatsApp
  whatsappNumber: string;
  whatsappMessage: string;
  whatsappEnabled: boolean;
  // Support
  supportEmail: string;
  supportInfo: string;
}

const defaultSettings: SiteSettings = {
  siteName: '',
  currency: 'USD',
  maintenanceMode: false,
  minDeposit: 10,
  announcementText: '',
  announcementEnabled: false,
  whatsappNumber: '',
  whatsappMessage: '',
  whatsappEnabled: false,
  supportEmail: '',
  supportInfo: '',
};

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

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        const s = data.settings || data.data || data;
        setSettings({
          siteName: s.siteName || s.site_name || '',
          currency: s.currency || 'USD',
          maintenanceMode: s.maintenanceMode || s.maintenance_mode || false,
          minDeposit: Number(s.minDeposit || s.min_deposit || 10),
          announcementText: s.announcementText || s.announcement_text || '',
          announcementEnabled: s.announcementEnabled || s.announcement_enabled || false,
          whatsappNumber: s.whatsappNumber || s.whatsapp_number || '',
          whatsappMessage: s.whatsappMessage || s.whatsapp_message || '',
          whatsappEnabled: s.whatsappEnabled || s.whatsapp_enabled || false,
          supportEmail: s.supportEmail || s.support_email || '',
          supportInfo: s.supportInfo || s.support_info || '',
        });
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        toast.success('Settings saved successfully');
      } else {
        toast.error('Failed to save settings');
      }
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const update = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: 'easeOut' as const, duration: 0.3 }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Site Settings</h1>
            <p className="text-sm text-slate-500 mt-1">Configure your SMM panel</p>
          </div>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {saving ? 'Saving...' : 'Save All Settings'}
          </Button>
        </div>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General */}
        <motion.div variants={item}>
          <Card className="border-l-4 border-l-indigo-500">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="size-5 text-indigo-600" />
                General
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Site Name</Label>
                <Input
                  placeholder="My SMM Panel"
                  value={settings.siteName}
                  onChange={(e) => update('siteName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={settings.currency} onValueChange={(v) => update('currency', v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (&euro;)</SelectItem>
                    <SelectItem value="PKR">PKR (Rs)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Maintenance Mode</Label>
                  <p className="text-xs text-slate-400 mt-0.5">Disable site access for users</p>
                </div>
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => update('maintenanceMode', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment Global */}
        <motion.div variants={item}>
          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="size-5 text-emerald-600" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Global Minimum Deposit</Label>
                <Input
                  type="number"
                  min={0}
                  value={settings.minDeposit}
                  onChange={(e) => update('minDeposit', Number(e.target.value))}
                />
                <p className="text-xs text-slate-400">Minimum deposit amount across all payment methods</p>
              </div>
              <Separator />
              <p className="text-sm text-slate-500">
                Configure individual payment methods in{' '}
                <a href="/admin/payment-settings" className="text-indigo-600 hover:underline font-medium">
                  Payment Settings
                </a>
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Announcement */}
        <motion.div variants={item}>
          <Card className="border-l-4 border-l-amber-500">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Megaphone className="size-5 text-amber-600" />
                Announcement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Announcement</Label>
                  <p className="text-xs text-slate-400 mt-0.5">Show a banner to all users</p>
                </div>
                <Switch
                  checked={settings.announcementEnabled}
                  onCheckedChange={(checked) => update('announcementEnabled', checked)}
                />
              </div>
              <div className="space-y-2">
                <Label>Announcement Text</Label>
                <Textarea
                  placeholder="Enter announcement text..."
                  value={settings.announcementText}
                  onChange={(e) => update('announcementText', e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* WhatsApp */}
        <motion.div variants={item}>
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageCircle className="size-5 text-green-600" />
                WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable WhatsApp</Label>
                  <p className="text-xs text-slate-400 mt-0.5">Show WhatsApp button to users</p>
                </div>
                <Switch
                  checked={settings.whatsappEnabled}
                  onCheckedChange={(checked) => update('whatsappEnabled', checked)}
                />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp Number</Label>
                <Input
                  placeholder="+92XXXXXXXXXX"
                  value={settings.whatsappNumber}
                  onChange={(e) => update('whatsappNumber', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp Message</Label>
                <Textarea
                  placeholder="Pre-filled message when user clicks WhatsApp button..."
                  value={settings.whatsappMessage}
                  onChange={(e) => update('whatsappMessage', e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Support */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="border-l-4 border-l-violet-500">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Headphones className="size-5 text-violet-600" />
                Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Support Email</Label>
                  <Input
                    type="email"
                    placeholder="support@example.com"
                    value={settings.supportEmail}
                    onChange={(e) => update('supportEmail', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Support Info</Label>
                <Textarea
                  placeholder="Additional support information displayed to users..."
                  value={settings.supportInfo}
                  onChange={(e) => update('supportInfo', e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}

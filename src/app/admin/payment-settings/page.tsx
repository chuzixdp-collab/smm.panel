'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Phone, Smartphone, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface PaymentMethod {
  id?: string;
  method: string;
  enabled: boolean;
  accountNumber: string;
  accountName: string;
  merchantNumber: string;
  minDeposit: number;
  maxDeposit: number;
  instructions: string;
}

const defaultMethod = (name: string): PaymentMethod => ({
  method: name,
  enabled: false,
  accountNumber: '',
  accountName: '',
  merchantNumber: '',
  minDeposit: 100,
  maxDeposit: 50000,
  instructions: '',
});

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { ease: 'easeOut' as const, duration: 0.3 } },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { ease: 'easeOut' as const, duration: 0.4 } },
};

export default function PaymentSettingsPage() {
  const [jazzCash, setJazzCash] = useState<PaymentMethod>(defaultMethod('jazzcash'));
  const [easypaisa, setEasypaisa] = useState<PaymentMethod>(defaultMethod('easypaisa'));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/payment-settings');
      if (res.ok) {
        const data = await res.json();
        const methods = Array.isArray(data) ? data : data.methods || [];
        const jc = methods.find((m: PaymentMethod) => m.method === 'jazzcash');
        const ep = methods.find((m: PaymentMethod) => m.method === 'easypaisa');
        if (jc) setJazzCash(jc);
        if (ep) setEasypaisa(ep);
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

  const handleSave = async (method: string, data: PaymentMethod) => {
    setSaving(method);
    try {
      const res = await fetch('/api/admin/payment-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast.success(`${method === 'jazzcash' ? 'JazzCash' : 'Easypaisa'} settings saved successfully`);
      } else {
        toast.error('Failed to save settings');
      }
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-10 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: 'easeOut' as const, duration: 0.3 }}>
        <h1 className="text-2xl font-bold text-slate-900">Payment Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Configure JazzCash and Easypaisa payment methods</p>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* JazzCash Card */}
        <motion.div variants={item}>
          <Card className="border-l-4 border-l-red-500">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
                  <Phone className="size-5" />
                </div>
                <CardTitle className="text-base">JazzCash</CardTitle>
              </div>
              <CardAction>
                <Switch
                  checked={jazzCash.enabled}
                  onCheckedChange={(checked) => setJazzCash((p) => ({ ...p, enabled: checked }))}
                />
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input
                  placeholder="03XX-XXXXXXX"
                  value={jazzCash.accountNumber}
                  onChange={(e) => setJazzCash((p) => ({ ...p, accountNumber: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Account Name</Label>
                <Input
                  placeholder="Account holder name"
                  value={jazzCash.accountName}
                  onChange={(e) => setJazzCash((p) => ({ ...p, accountName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Merchant Number <span className="text-slate-400 font-normal">(optional)</span></Label>
                <Input
                  placeholder="Merchant number"
                  value={jazzCash.merchantNumber}
                  onChange={(e) => setJazzCash((p) => ({ ...p, merchantNumber: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Deposit</Label>
                  <Input
                    type="number"
                    min={0}
                    value={jazzCash.minDeposit}
                    onChange={(e) => setJazzCash((p) => ({ ...p, minDeposit: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Deposit</Label>
                  <Input
                    type="number"
                    min={0}
                    value={jazzCash.maxDeposit}
                    onChange={(e) => setJazzCash((p) => ({ ...p, maxDeposit: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Payment Instructions</Label>
                <Textarea
                  placeholder="Instructions for users on how to make payment..."
                  value={jazzCash.instructions}
                  onChange={(e) => setJazzCash((p) => ({ ...p, instructions: e.target.value }))}
                  rows={3}
                />
              </div>
              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                onClick={() => handleSave('jazzcash', jazzCash)}
                disabled={saving === 'jazzcash'}
              >
                {saving === 'jazzcash' ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                {saving === 'jazzcash' ? 'Saving...' : 'Save JazzCash Settings'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Easypaisa Card */}
        <motion.div variants={item}>
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                  <Smartphone className="size-5" />
                </div>
                <CardTitle className="text-base">Easypaisa</CardTitle>
              </div>
              <CardAction>
                <Switch
                  checked={easypaisa.enabled}
                  onCheckedChange={(checked) => setEasypaisa((p) => ({ ...p, enabled: checked }))}
                />
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input
                  placeholder="03XX-XXXXXXX"
                  value={easypaisa.accountNumber}
                  onChange={(e) => setEasypaisa((p) => ({ ...p, accountNumber: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Account Name</Label>
                <Input
                  placeholder="Account holder name"
                  value={easypaisa.accountName}
                  onChange={(e) => setEasypaisa((p) => ({ ...p, accountName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Merchant Number <span className="text-slate-400 font-normal">(optional)</span></Label>
                <Input
                  placeholder="Merchant number"
                  value={easypaisa.merchantNumber}
                  onChange={(e) => setEasypaisa((p) => ({ ...p, merchantNumber: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Deposit</Label>
                  <Input
                    type="number"
                    min={0}
                    value={easypaisa.minDeposit}
                    onChange={(e) => setEasypaisa((p) => ({ ...p, minDeposit: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Deposit</Label>
                  <Input
                    type="number"
                    min={0}
                    value={easypaisa.maxDeposit}
                    onChange={(e) => setEasypaisa((p) => ({ ...p, maxDeposit: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Payment Instructions</Label>
                <Textarea
                  placeholder="Instructions for users on how to make payment..."
                  value={easypaisa.instructions}
                  onChange={(e) => setEasypaisa((p) => ({ ...p, instructions: e.target.value }))}
                  rows={3}
                />
              </div>
              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                onClick={() => handleSave('easypaisa', easypaisa)}
                disabled={saving === 'easypaisa'}
              >
                {saving === 'easypaisa' ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                {saving === 'easypaisa' ? 'Saving...' : 'Save Easypaisa Settings'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
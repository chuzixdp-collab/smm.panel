'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Send,
  Trash2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Info,
  Layers,
 DollarSign,
  Hash,
  Link,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
import { formatCurrency, truncate } from '@/lib/utils';
import { toast } from 'sonner';

interface Service {
  id: number;
  name: string;
  rate: number;
  min: number;
  max: number;
}

interface ParsedLine {
  line: number;
  serviceId: number;
  link: string;
  quantity: number;
  price: number;
  error?: string;
  serviceName?: string;
}

interface MassOrderResult {
  success: number;
  failed: number;
  totalCharge: number;
  orders: { line: number; orderId?: string; error?: string }[];
}

export default function MassOrderPage() {
  const [text, setText] = useState('');
  const [services, setServices] = useState<Record<number, Service>>({});
  const [servicesLoaded, setServicesLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<MassOrderResult | null>(null);

  useEffect(() => {
    const loadServices = async () => {
      try {
        const res = await fetch('/api/services');
        if (res.ok) {
          const json = await res.json();
          const list: Service[] = json.data?.services || json.data || [];
          const map: Record<number, Service> = {};
          list.forEach((s) => {
            map[s.id] = s;
          });
          setServices(map);
        }
      } catch {
        // silent
      } finally {
        setServicesLoaded(true);
      }
    };
    loadServices();
  }, []);

  const parsedLines = useMemo(() => {
    if (!text.trim()) return [];
    const lines = text.trim().split('\n').filter((l) => l.trim());
    return lines.map((line, idx) => {
      const parts = line.split('|').map((p) => p.trim());
      if (parts.length !== 3) {
        return {
          line: idx + 1,
          serviceId: 0,
          link: '',
          quantity: 0,
          price: 0,
          error: 'Invalid format: expected service_id|link|quantity',
        } as ParsedLine;
      }

      const serviceId = parseInt(parts[0], 10);
      const link = parts[1];
      const quantity = parseInt(parts[2], 10);

      if (isNaN(serviceId)) {
        return {
          line: idx + 1,
          serviceId: 0,
          link,
          quantity,
          price: 0,
          error: 'Invalid service ID',
        };
      }

      if (!link) {
        return {
          line: idx + 1,
          serviceId,
          link: '',
          quantity,
          price: 0,
          error: 'Link is required',
        };
      }

      if (isNaN(quantity) || quantity <= 0) {
        return {
          line: idx + 1,
          serviceId,
          link,
          quantity: 0,
          price: 0,
          error: 'Invalid quantity',
        };
      }

      const service = services[serviceId];
      if (!service) {
        return {
          line: idx + 1,
          serviceId,
          link,
          quantity,
          price: 0,
          error: `Service #${serviceId} not found`,
        };
      }

      const price = (quantity / 1000) * service.rate;

      return {
        line: idx + 1,
        serviceId,
        link,
        quantity,
        price,
        serviceName: service.name,
      };
    });
  }, [text, services]);

  const validLines = parsedLines.filter((l) => !l.error);
  const errorLines = parsedLines.filter((l) => l.error);
  const totalCharge = validLines.reduce((sum, l) => sum + l.price, 0);

  const handleSubmit = async () => {
    if (validLines.length === 0) {
      toast.error('No valid orders to submit');
      return;
    }

    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch('/api/mass-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orders: validLines.map((l) => ({
            serviceId: l.serviceId,
            link: l.link,
            quantity: l.quantity,
          })),
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        setResult({
          success: data.success || data.successCount || 0,
          failed: data.failed || data.failedCount || 0,
          totalCharge: data.totalCharge || 0,
          orders: data.orders || [],
        });
        toast.success(`Mass order submitted: ${data.success || 0} successful`);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to submit mass order');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClear = () => {
    setText('');
    setResult(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mass Order</h1>
        <p className="mt-1 text-sm text-slate-500">Place multiple orders at once</p>
      </div>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' as const }}
      >
        <Card className="border-indigo-200 bg-indigo-50/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-slate-700">
                <p className="font-medium">Format Instructions</p>
                <p className="mt-1 text-slate-600">
                  One order per line in the following format:{' '}
                  <code className="rounded bg-indigo-100 px-1.5 py-0.5 text-xs font-mono text-indigo-700">
                    service_id|link|quantity
                  </code>
                </p>
                <p className="mt-1 text-slate-500">
                  Example: <code className="text-xs font-mono">101|https://instagram.com/user|1000</code>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Textarea */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' as const, delay: 0.05 }}
      >
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <FileText className="h-5 w-5" />
              Orders Input
            </CardTitle>
            <CardDescription>Paste your orders below, one per line</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder={"101|https://instagram.com/user1|1000\n102|https://instagram.com/user2|500\n103|https://instagram.com/user3|2000"}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setResult(null);
              }}
              rows={8}
              className="font-mono text-sm"
            />
            <div className="flex gap-3">
              <Button
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={handleSubmit}
                disabled={submitting || validLines.length === 0}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {submitting ? 'Submitting...' : `Submit ${validLines.length} Order${validLines.length !== 1 ? 's' : ''}`}
              </Button>
              <Button variant="outline" onClick={handleClear} disabled={submitting}>
                <Trash2 className="h-4 w-4" />
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Preview Table */}
      {parsedLines.length > 0 && !result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' as const }}
        >
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-900">Order Preview</CardTitle>
              <CardDescription>
                {validLines.length} valid, {errorLines.length} invalid
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                      <TableHead className="text-slate-500">#</TableHead>
                      <TableHead className="text-slate-500">Service</TableHead>
                      <TableHead className="text-slate-500">Link</TableHead>
                      <TableHead className="text-right text-slate-500">Quantity</TableHead>
                      <TableHead className="text-right text-slate-500">Price</TableHead>
                      <TableHead className="text-slate-500">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedLines.map((item) => (
                      <TableRow key={item.line}>
                        <TableCell className="font-mono text-xs text-slate-500">{item.line}</TableCell>
                        <TableCell className="text-sm text-slate-700">
                          {item.serviceName ? (
                            <span>{item.serviceName}</span>
                          ) : (
                            <span className="text-slate-400">#{item.serviceId}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-slate-500 max-w-[200px] truncate">
                          {truncate(item.link, 35) || '—'}
                        </TableCell>
                        <TableCell className="text-right text-sm text-slate-600 tabular-nums">
                          {item.quantity > 0 ? item.quantity.toLocaleString() : '—'}
                        </TableCell>
                        <TableCell className="text-right text-sm text-slate-600 tabular-nums">
                          {item.price > 0 ? formatCurrency(item.price) : '—'}
                        </TableCell>
                        <TableCell>
                          {item.error ? (
                            <span className="inline-flex items-center gap-1 text-xs text-red-600">
                              <XCircle className="h-3 w-3" />
                              {item.error}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600">
                              <CheckCircle2 className="h-3 w-3" />
                              Valid
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Separator />

              {/* Summary */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4">
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Layers className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-500">Total orders:</span>
                    <span className="font-semibold text-slate-900">{validLines.length}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <DollarSign className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-500">Total charge:</span>
                    <span className="font-semibold text-indigo-600">{formatCurrency(totalCharge)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Result */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' as const }}
        >
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-900">Order Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-xl bg-green-50 p-4 text-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto" />
                  <p className="text-2xl font-bold text-green-700 mt-1">{result.success}</p>
                  <p className="text-xs text-green-600">Successful</p>
                </div>
                <div className="rounded-xl bg-red-50 p-4 text-center">
                  <XCircle className="h-6 w-6 text-red-500 mx-auto" />
                  <p className="text-2xl font-bold text-red-600 mt-1">{result.failed}</p>
                  <p className="text-xs text-red-500">Failed</p>
                </div>
                <div className="rounded-xl bg-indigo-50 p-4 text-center">
                  <DollarSign className="h-6 w-6 text-indigo-600 mx-auto" />
                  <p className="text-2xl font-bold text-indigo-700 mt-1">{formatCurrency(result.totalCharge)}</p>
                  <p className="text-xs text-indigo-600">Total Charge</p>
                </div>
              </div>
              <Button variant="outline" onClick={handleClear} className="w-fit">
                <Trash2 className="h-4 w-4" />
                Clear & Start New
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

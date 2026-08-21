'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Key,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronUp,
  Info,
  Check,
  Globe,
  Clock,
  Zap,
  ShoppingCart,
  DollarSign,
  Layers,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { formatDate, timeAgo } from '@/lib/utils';
import { toast } from 'sonner';

interface ApiKey {
  id: string;
  key: string;
  keyPrefix: string;
  lastUsed: string | null;
  createdAt: string;
}

interface ApiDoc {
  method: string;
  endpoint: string;
  description: string;
  params: { name: string; type: string; required: boolean; desc: string }[];
  getExampleRequest: (baseUrl: string) => string;
  exampleResponse: string;
}

const API_DOCS: ApiDoc[] = [
  {
    method: 'GET',
    endpoint: '/api/v1/services',
    description: 'Get all available services with pricing and limits.',
    params: [],
    getExampleRequest: (base) => `curl -H "Authorization: Bearer sk_YourApiKey" \\
  ${base}/api/v1/services`,
    exampleResponse: JSON.stringify(
      { services: [{ service: 'clx...', name: 'Instagram Followers [Real]', type: 'Default', rate: 1.5, min: 100, max: 10000, category: 'Instagram Followers', description: '', refill: true, cancel: false }] },
      null, 2
    ),
  },
  {
    method: 'POST',
    endpoint: '/api/v1/order',
    description: 'Create a new order. Supports form-encoded or JSON body.',
    params: [
      { name: 'service', type: 'string', required: true, desc: 'Service ID' },
      { name: 'link', type: 'string', required: true, desc: 'Target URL or username' },
      { name: 'quantity', type: 'number', required: true, desc: 'Order quantity' },
    ],
    getExampleRequest: (base) => `curl -X POST \\
  -H "Authorization: Bearer sk_YourApiKey" \\
  -d "service=clxabc123" \\
  -d "link=https://instagram.com/user" \\
  -d "quantity=1000" \\
  ${base}/api/v1/order`,
    exampleResponse: JSON.stringify({ order: 'clxabc123def' }, null, 2),
  },
  {
    method: 'GET',
    endpoint: '/api/v1/order/status',
    description: 'Check the status of a single order by its ID.',
    params: [
      { name: 'order', type: 'string', required: true, desc: 'Order ID returned from create order' },
    ],
    getExampleRequest: (base) => `curl -H "Authorization: Bearer sk_YourApiKey" \\
  "${base}/api/v1/order/status?order=clxabc123def"`,
    exampleResponse: JSON.stringify({ order: 'clxabc123def', charge: 1.5, start_count: 1500, status: 'PROCESSING', remains: 800, link: 'https://instagram.com/user' }, null, 2),
  },
  {
    method: 'GET',
    endpoint: '/api/v1/orders',
    description: 'Bulk status check for multiple orders (comma-separated IDs, max 100).',
    params: [
      { name: 'orders', type: 'string', required: true, desc: 'Comma-separated order IDs' },
    ],
    getExampleRequest: (base) => `curl -H "Authorization: Bearer sk_YourApiKey" \\
  "${base}/api/v1/orders?orders=clxabc,clxdef"`,
    exampleResponse: JSON.stringify({ orders: [{ order: 'clxabc', charge: 1.5, start_count: 0, status: 'PROCESSING', remains: 500 }, { order: 'clxdef', charge: 2.0, start_count: 100, status: 'COMPLETED', remains: 0 }] }, null, 2),
  },
  {
    method: 'GET',
    endpoint: '/api/v1/balance',
    description: 'Get your current account balance.',
    params: [],
    getExampleRequest: (base) => `curl -H "Authorization: Bearer sk_YourApiKey" \\
  ${base}/api/v1/balance`,
    exampleResponse: JSON.stringify({ balance: 125.5, currency: 'USD' }, null, 2),
  },
];

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-green-100 text-green-700',
  POST: 'bg-blue-100 text-blue-700',
};

function ApiKeySkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-5 w-64" />
      <Skeleton className="h-12 w-full max-w-md" />
      <div className="flex gap-3">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-32" />
      </div>
    </div>
  );
}

export default function ApiDashboardPage() {
  const [apiKey, setApiKey] = useState<ApiKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const [regenerateDialog, setRegenerateDialog] = useState(false);
  const [revokeDialog, setRevokeDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const baseUrl = mounted ? `${window.location.origin}` : 'https://your-domain.com';

  useEffect(() => { setMounted(true); }, []);

  const fetchApiKey = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/api-key');
      if (res.ok) {
        const json = await res.json();
        const data = json.data?.apiKey || json.data?.key || json.data;
        setApiKey(data || null);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchApiKey(); }, [fetchApiKey]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleGenerate = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/api-key', { method: 'POST' });
      if (res.ok) {
        toast.success('API key generated');
        fetchApiKey();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to generate key');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/api-key/regenerate', { method: 'POST' });
      if (res.ok) {
        toast.success('API key regenerated');
        setRegenerateDialog(false);
        fetchApiKey();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to regenerate key');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevoke = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/api-key', { method: 'DELETE' });
      if (res.ok) {
        toast.success('API key revoked');
        setRevokeDialog(false);
        setApiKey(null);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to revoke key');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setActionLoading(false);
    }
  };

  const maskedKey = apiKey
    ? `${apiKey.keyPrefix || 'sk_'}****${apiKey.key.slice(-4)}`
    : '';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">API Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your API key and view documentation</p>
      </div>

      {/* Base URL Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: 'easeOut' as const }}>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 flex-shrink-0">
                  <Globe className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">API Base URL</p>
                  <p className="text-sm font-mono text-slate-900 truncate">{baseUrl}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => copyToClipboard(baseUrl, 'baseurl')}>
                {copied === 'baseurl' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied === 'baseurl' ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Auth Info */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Key className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold">Authentication</p>
              <p className="mt-1 text-amber-700">
                Include your API key in the <code className="bg-amber-100 px-1 rounded text-xs font-mono">Authorization</code> header:
              </p>
              <pre className="mt-2 rounded bg-white border border-amber-200 px-3 py-2 text-xs font-mono text-slate-700">
                Authorization: Bearer {'{'}your_api_key{'}'}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Key Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: 'easeOut' as const, delay: 0.05 }}>
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Key className="h-5 w-5" />
              Your API Key
            </CardTitle>
            <CardDescription>Generate and manage your secret API key</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <ApiKeySkeleton />
            ) : !apiKey ? (
              <div className="text-center py-6">
                <div className="rounded-full bg-slate-100 p-4 inline-block">
                  <Key className="h-8 w-8 text-slate-400" />
                </div>
                <p className="mt-3 text-sm text-slate-500">No API key generated yet</p>
                <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700" onClick={handleGenerate} disabled={actionLoading}>
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                  Generate API Key
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <Key className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <code className="text-sm font-mono text-slate-800 flex-1 truncate">
                      {showKey ? apiKey.key : maskedKey}
                    </code>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => setShowKey(!showKey)}>
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(apiKey.key, 'apikey')}>
                      {copied === 'apikey' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    Prefix: <code className="font-mono text-slate-700">{apiKey.keyPrefix || 'sk_'}</code>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Created: {formatDate(apiKey.createdAt)}
                  </span>
                  {apiKey.lastUsed && (
                    <span className="inline-flex items-center gap-1">
                      Last used: {timeAgo(apiKey.lastUsed)}
                    </span>
                  )}
                </div>

                <Separator />

                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={() => setRegenerateDialog(true)} disabled={actionLoading}>
                    <RefreshCw className="h-4 w-4" />
                    Regenerate Key
                  </Button>
                  <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setRevokeDialog(true)} disabled={actionLoading}>
                    <Trash2 className="h-4 w-4" />
                    Revoke Key
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Regenerate Dialog */}
      <Dialog open={regenerateDialog} onOpenChange={setRegenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate API Key?</DialogTitle>
            <DialogDescription>
              This will revoke your current API key and generate a new one. Any applications using the old key will immediately lose access.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegenerateDialog(false)}>Cancel</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleRegenerate} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Dialog */}
      <Dialog open={revokeDialog} onOpenChange={setRevokeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke API Key?</DialogTitle>
            <DialogDescription>
              This will permanently delete your API key. All API requests will fail until you generate a new key.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRevoke} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Revoke Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* API Documentation */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: 'easeOut' as const, delay: 0.1 }}>
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Info className="h-5 w-5" />
              API Documentation
            </CardTitle>
            <CardDescription>Available endpoints for integration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {API_DOCS.map((doc) => {
              const exampleReq = doc.getExampleRequest(baseUrl);
              return (
                <div key={doc.endpoint} className="rounded-lg border border-slate-200 overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors text-left"
                    onClick={() => setExpandedDoc(expandedDoc === doc.endpoint ? null : doc.endpoint)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${METHOD_COLORS[doc.method] || 'bg-slate-100 text-slate-600'}`}>
                        {doc.method}
                      </span>
                      <span className="text-sm font-mono text-slate-800 truncate">{doc.endpoint}</span>
                      <span className="text-sm text-slate-500 hidden sm:inline">— {doc.description}</span>
                    </div>
                    {expandedDoc === doc.endpoint ? (
                      <ChevronUp className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    )}
                  </button>

                  <AnimatePresence>
                    {expandedDoc === doc.endpoint && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' as const }}
                      >
                        <div className="border-t border-slate-100 p-4 space-y-4 bg-slate-50/30">
                          <p className="text-sm text-slate-600">{doc.description}</p>

                          {doc.params.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-slate-700 mb-2">Parameters</p>
                              <div className="rounded-lg border border-slate-200 overflow-hidden">
                                <table className="w-full text-sm">
                                  <thead className="bg-slate-100/50">
                                    <tr>
                                      <th className="text-left px-3 py-2 text-xs font-medium text-slate-500">Name</th>
                                      <th className="text-left px-3 py-2 text-xs font-medium text-slate-500">Type</th>
                                      <th className="text-left px-3 py-2 text-xs font-medium text-slate-500">Required</th>
                                      <th className="text-left px-3 py-2 text-xs font-medium text-slate-500">Description</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {doc.params.map((param) => (
                                      <tr key={param.name} className="border-t border-slate-100">
                                        <td className="px-3 py-2 font-mono text-xs text-indigo-600">{param.name}</td>
                                        <td className="px-3 py-2 text-xs text-slate-600">{param.type}</td>
                                        <td className="px-3 py-2">
                                          {param.required ? (
                                            <Badge variant="secondary" className="bg-red-50 text-red-600 text-[10px]">Required</Badge>
                                          ) : (
                                            <Badge variant="secondary" className="text-[10px]">Optional</Badge>
                                          )}
                                        </td>
                                        <td className="px-3 py-2 text-xs text-slate-600">{param.desc}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-semibold text-slate-700">Example Request</p>
                              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => copyToClipboard(exampleReq, `req-${doc.endpoint}`)}>
                                {copied === `req-${doc.endpoint}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                              </Button>
                            </div>
                            <pre className="rounded-lg bg-slate-900 text-green-400 p-3 text-xs overflow-x-auto font-mono whitespace-pre-wrap">
                              {exampleReq}
                            </pre>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-slate-700 mb-2">Example Response</p>
                            <pre className="rounded-lg bg-slate-900 text-blue-300 p-3 text-xs overflow-x-auto font-mono">
                              {doc.exampleResponse}
                            </pre>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

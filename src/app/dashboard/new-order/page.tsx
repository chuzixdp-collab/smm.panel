'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, Package, ShoppingCart, AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

interface Service {
  id: string;
  name: string;
  platform: string;
  category: string;
  description: string | null;
  price: number;
  minQuantity: number;
  maxQuantity: number;
  refillAvailable: boolean;
  cancelAvailable: boolean;
  status: string;
}

export default function NewOrderPage() {
  const router = useRouter();
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [quantity, setQuantity] = useState('');

  const fetchPlatforms = useCallback(async () => {
    try {
      const res = await fetch('/api/services/platforms');
      if (res.ok) {
        const json = await res.json();
        setPlatforms(json.data || []);
      }
    } catch {
      // silent
    }
  }, []);

  const fetchServices = useCallback(async (platform?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '500' });
      if (platform) params.set('platform', platform);
      const res = await fetch(`/api/services?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setServices(json.data?.services || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlatforms();
    fetchServices();
  }, [fetchPlatforms, fetchServices]);

  // Derive categories from loaded services
  const categories = useMemo(() => {
    const source = selectedPlatform
      ? services.filter((s) => s.platform === selectedPlatform)
      : services;
    const cats = [...new Set(source.map((s) => s.category))].sort();
    return cats;
  }, [services, selectedPlatform]);

  // Filter services by platform + category
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      if (selectedPlatform && s.platform !== selectedPlatform) return false;
      if (selectedCategory && s.category !== selectedCategory) return false;
      return true;
    });
  }, [services, selectedPlatform, selectedCategory]);

  const selectedService = useMemo(() => {
    return services.find((s) => s.id === selectedServiceId) || null;
  }, [services, selectedServiceId]);

  const estimatedTotal = useMemo(() => {
    if (!selectedService || !quantity) return 0;
    const qty = parseInt(quantity);
    if (isNaN(qty)) return 0;
    return (selectedService.price * qty) / 1000;
  }, [selectedService, quantity]);

  const handlePlatformChange = (val: string) => {
    setSelectedPlatform(val);
    setSelectedCategory('');
    setSelectedServiceId('');
  };

  const handleCategoryChange = (val: string) => {
    setSelectedCategory(val);
    setSelectedServiceId('');
  };

  const handleSubmit = async () => {
    if (!selectedServiceId) {
      toast.error('Please select a service');
      return;
    }
    if (!targetUrl.trim()) {
      toast.error('Please enter a target URL');
      return;
    }
    if (!quantity || isNaN(parseInt(quantity))) {
      toast.error('Please enter a valid quantity');
      return;
    }
    const qty = parseInt(quantity);
    if (selectedService) {
      if (qty < selectedService.minQuantity) {
        toast.error(`Minimum quantity is ${selectedService.minQuantity.toLocaleString()}`);
        return;
      }
      if (qty > selectedService.maxQuantity) {
        toast.error(`Maximum quantity is ${selectedService.maxQuantity.toLocaleString()}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedServiceId,
          targetUrl: targetUrl.trim(),
          quantity: qty,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success('Order placed successfully!');
        router.push('/dashboard/orders');
      } else {
        toast.error(json.error || 'Failed to place order');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!loading && services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-full bg-slate-100 p-6">
          <Package className="h-10 w-10 text-slate-400" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-slate-900">No Services Available</h2>
        <p className="mt-2 text-sm text-slate-500 max-w-md">
          No services are available at the moment. Please check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">New Order</h1>
        <p className="mt-1 text-sm text-slate-500">
          Select a service and place your order
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left side - Form */}
        <div className="lg:col-span-2 space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' as const }}
          >
            <Card className="border-slate-200">
              <CardContent className="p-6 space-y-5">
                {/* Platform Selector */}
                <div className="space-y-2">
                  <Label className="text-slate-700">Platform</Label>
                  {loading ? (
                    <Skeleton className="h-9 w-full" />
                  ) : (
                    <Select value={selectedPlatform} onValueChange={handlePlatformChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Platforms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Platforms</SelectItem>
                        {platforms.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Category Selector */}
                <div className="space-y-2">
                  <Label className="text-slate-700">Category</Label>
                  {loading ? (
                    <Skeleton className="h-9 w-full" />
                  ) : (
                    <Select
                      value={selectedCategory}
                      onValueChange={handleCategoryChange}
                      disabled={!selectedPlatform && categories.length === 0}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Categories</SelectItem>
                        {categories.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Service Selector */}
                <div className="space-y-2">
                  <Label className="text-slate-700">Service</Label>
                  {loading ? (
                    <Skeleton className="h-9 w-full" />
                  ) : (
                    <Select
                      value={selectedServiceId}
                      onValueChange={setSelectedServiceId}
                      disabled={filteredServices.length === 0}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={
                          filteredServices.length === 0
                            ? 'No services found'
                            : 'Select a service'
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredServices.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            <div className="flex items-center justify-between gap-4 w-full">
                              <span className="truncate">{s.name}</span>
                              <span className="text-xs text-slate-400 flex-shrink-0">
                                ${s.price.toFixed(3)}/1K
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Target URL */}
                <div className="space-y-2">
                  <Label htmlFor="targetUrl" className="text-slate-700">
                    Target URL
                  </Label>
                  <Input
                    id="targetUrl"
                    type="url"
                    placeholder="https://www.instagram.com/p/example/"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                  />
                </div>

                {/* Quantity */}
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-slate-700">
                    Quantity
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="Enter quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    min={selectedService?.minQuantity}
                    max={selectedService?.maxQuantity}
                  />
                  {selectedService && (
                    <p className="text-xs text-slate-400">
                      Min: {selectedService.minQuantity.toLocaleString()} — Max:{' '}
                      {selectedService.maxQuantity.toLocaleString()}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right side - Order Summary */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' as const }}
            className="sticky top-6"
          >
            <Card className="border-slate-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-indigo-600" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!selectedService ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="rounded-full bg-slate-100 p-3">
                      <Zap className="h-5 w-5 text-slate-400" />
                    </div>
                    <p className="mt-3 text-sm text-slate-500">
                      Select a service to see details
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Service</span>
                        <span className="font-medium text-slate-900 text-right max-w-[180px] truncate">
                          {selectedService.name}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Platform</span>
                        <span className="text-slate-700">{selectedService.platform}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Category</span>
                        <span className="text-slate-700">{selectedService.category}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Price / 1K</span>
                        <span className="font-medium text-slate-900">
                          ${selectedService.price.toFixed(3)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Min Quantity</span>
                        <span className="text-slate-700 tabular-nums">
                          {selectedService.minQuantity.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Max Quantity</span>
                        <span className="text-slate-700 tabular-nums">
                          {selectedService.maxQuantity.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {selectedService.refillAvailable && (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                            Refill
                          </span>
                        )}
                        {selectedService.cancelAvailable && (
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                            Cancel
                          </span>
                        )}
                      </div>
                      <Separator />

                      {quantity && !isNaN(parseInt(quantity)) && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Quantity</span>
                          <span className="text-slate-900 font-medium tabular-nums">
                            {parseInt(quantity).toLocaleString()}
                          </span>
                        </div>
                      )}

                      <div className="rounded-lg bg-indigo-50 p-4">
                        <p className="text-xs text-indigo-500 font-medium">Estimated Total</p>
                        <p className="mt-1 text-2xl font-bold text-indigo-600 tabular-nums">
                          {estimatedTotal > 0
                            ? formatCurrency(estimatedTotal)
                            : '$0.00'}
                        </p>
                        <p className="mt-1 text-xs text-indigo-400">
                          Final charge calculated by server
                        </p>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-indigo-600 hover:bg-indigo-700 h-11 text-sm font-semibold"
                      onClick={handleSubmit}
                      disabled={submitting || !selectedServiceId || !targetUrl.trim() || !quantity}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Placing Order...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Place Order
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

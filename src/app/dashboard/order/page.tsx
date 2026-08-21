'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, ChevronLeft, Loader2, Check, Package, Link as LinkIcon, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface Platform {
  platform: string;
}

interface Service {
  id: string;
  name: string;
  platform: string;
  category: string;
  price: number;
  minQuantity: number;
  maxQuantity: number;
  refillAvailable: boolean;
  cancelAvailable: boolean;
}

const steps = ['Platform', 'Service', 'Details', 'Confirm'];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-6 flex items-center justify-center gap-1 sm:gap-2">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center">
          <div className="flex items-center gap-1.5">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                i < currentStep
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                  : i === currentStep
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-500'
              }`}
            >
              {i < currentStep ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span className={`hidden text-xs sm:inline ${i <= currentStep ? 'font-medium text-gray-900' : 'text-gray-400'}`}>
              {step}
            </span>
          </div>
          {i < steps.length - 1 && (
            <ChevronRight className="mx-1 h-4 w-4 text-gray-300" />
          )}
        </div>
      ))}
    </div>
  );
}

export default function NewOrderPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [targetUrl, setTargetUrl] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [platformsLoading, setPlatformsLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(false);

  useEffect(() => {
    async function fetchPlatforms() {
      try {
        const res = await fetch('/api/services/platforms');
        if (res.ok) {
          const json = await res.json();
          setPlatforms(json.data || []);
        }
      } catch {
        // silent
      } finally {
        setPlatformsLoading(false);
      }
    }
    fetchPlatforms();
  }, []);

  const handleSelectPlatform = async (platform: string) => {
    setSelectedPlatform(platform);
    setSelectedService(null);
    setServicesLoading(true);
    setStep(1);
    try {
      const res = await fetch(`/api/services?platform=${encodeURIComponent(platform)}`);
      if (res.ok) {
        const json = await res.json();
        setServices(json.data.services || []);
      }
    } catch {
      // silent
    } finally {
      setServicesLoading(false);
    }
  };

  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    setQuantity('');
    setTargetUrl('');
    setStep(2);
  };

  const calculatedPrice =
    selectedService && quantity
      ? ((selectedService.price * parseInt(quantity)) / 1000).toFixed(2)
      : '0.00';

  const quantityNum = parseInt(quantity) || 0;
  const isValidQuantity =
    selectedService &&
    quantityNum >= selectedService.minQuantity &&
    quantityNum <= selectedService.maxQuantity;

  const canConfirm =
    targetUrl.trim() &&
    isValidQuantity &&
    selectedService;

  const handlePlaceOrder = async () => {
    if (!selectedService || !targetUrl.trim() || !isValidQuantity) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedService.id,
          targetUrl: targetUrl.trim(),
          quantity: quantityNum,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Order placed successfully!');
        router.push('/dashboard/orders');
      } else {
        toast.error(json.error || 'Failed to place order');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <StepIndicator currentStep={step} />

      {/* Step 0: Platform Selection */}
      {step === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 lg:p-6">
            <h2 className="mb-4 text-base font-semibold text-gray-900">Select a Platform</h2>
            {platformsLoading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            ) : platforms.length === 0 ? (
              <div className="py-12 text-center">
                <Package className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                <p className="text-sm text-gray-500">No platforms available</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {platforms.map((p) => (
                  <button
                    key={p}
                    onClick={() => handleSelectPlatform(p)}
                    className={`rounded-xl border-2 p-4 text-left text-sm font-medium transition-all hover:shadow-md ${
                      selectedPlatform === p
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 1: Service Selection */}
      {step === 1 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 lg:p-6">
            <button
              onClick={() => setStep(0)}
              className="mb-3 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            <h2 className="mb-1 text-base font-semibold text-gray-900">Select a Service</h2>
            <p className="mb-4 text-sm text-gray-500">Platform: {selectedPlatform}</p>

            {servicesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
            ) : services.length === 0 ? (
              <div className="py-12 text-center">
                <Package className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                <p className="text-sm text-gray-500">No services for this platform</p>
              </div>
            ) : (
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {services.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectService(s)}
                    className={`w-full rounded-xl border-2 p-3 text-left transition-all hover:shadow-md ${
                      selectedService?.id === s.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">{s.name}</p>
                        <p className="mt-0.5 text-xs text-gray-500">{s.category}</p>
                      </div>
                      <p className="text-sm font-semibold text-blue-600">${s.price.toFixed(2)}/1K</p>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                      <span>Min: {s.minQuantity.toLocaleString()}</span>
                      <span>•</span>
                      <span>Max: {s.maxQuantity.toLocaleString()}</span>
                      {s.refillAvailable && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 text-[10px]">
                          Refill
                        </Badge>
                      )}
                      {s.cancelAvailable && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-100 text-[10px]">
                          Cancel
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Enter Details */}
      {step === 2 && selectedService && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 lg:p-6">
            <button
              onClick={() => setStep(1)}
              className="mb-3 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            <h2 className="mb-4 text-base font-semibold text-gray-900">Enter Order Details</h2>

            <div className="space-y-4">
              <div>
                <Label className="mb-1.5">Selected Service</Label>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-sm font-medium text-gray-900">{selectedService.name}</p>
                  <p className="text-xs text-gray-500">{selectedService.platform} • ${selectedService.price.toFixed(2)} per 1,000</p>
                </div>
              </div>

              <div>
                <Label htmlFor="targetUrl" className="mb-1.5">Target URL</Label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="targetUrl"
                    placeholder="https://instagram.com/username"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="quantity" className="mb-1.5">
                  Quantity
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    ({selectedService.minQuantity.toLocaleString()} - {selectedService.maxQuantity.toLocaleString()})
                  </span>
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder={`Min: ${selectedService.minQuantity}`}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min={selectedService.minQuantity}
                  max={selectedService.maxQuantity}
                />
                {quantity && !isValidQuantity && (
                  <p className="mt-1 text-xs text-red-500">
                    Quantity must be between {selectedService.minQuantity.toLocaleString()} and {selectedService.maxQuantity.toLocaleString()}
                  </p>
                )}
              </div>

              {quantity && isValidQuantity && (
                <div className="rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 p-4">
                  <p className="text-sm text-gray-600">Estimated Charge</p>
                  <p className="text-2xl font-bold text-gray-900">${calculatedPrice}</p>
                </div>
              )}

              <Button
                onClick={() => setStep(3)}
                disabled={!canConfirm}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white"
              >
                Continue to Confirm
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Confirm & Place Order */}
      {step === 3 && selectedService && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 lg:p-6">
            <button
              onClick={() => setStep(2)}
              className="mb-3 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            <h2 className="mb-4 text-base font-semibold text-gray-900">Confirm Your Order</h2>

            <div className="space-y-3 rounded-xl bg-gray-50 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Platform</span>
                <span className="font-medium text-gray-900">{selectedService.platform}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Service</span>
                <span className="font-medium text-gray-900">{selectedService.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Target URL</span>
                <span className="max-w-[60%] truncate font-medium text-gray-900 text-right">{targetUrl}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Quantity</span>
                <span className="font-medium text-gray-900">{quantityNum.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Rate</span>
                <span className="font-medium text-gray-900">${selectedService.price.toFixed(2)} / 1,000</span>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between">
                  <span className="text-sm font-semibold text-gray-900">Total Charge</span>
                  <span className="text-lg font-bold text-blue-600">${calculatedPrice}</span>
                </div>
              </div>
            </div>

            <Button
              onClick={handlePlaceOrder}
              disabled={submitting}
              className="mt-4 w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Placing Order...
                </>
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Place Order - ${calculatedPrice}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

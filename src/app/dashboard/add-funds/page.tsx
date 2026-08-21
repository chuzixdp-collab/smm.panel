'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  ArrowLeftRight,
  Info,
  FileText,
  DollarSign,
  ImageIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

interface PaymentMethod {
  method: string;
  accountNumber: string | null;
  accountName: string | null;
  minDeposit: number;
  maxDeposit: number;
  instructions: string | null;
}

type Step = 1 | 2 | 3 | 4 | 5;

const METHOD_ICONS: Record<string, string> = {
  JAZZCASH: '💚',
  EASYPAISA: '🟢',
};

const METHOD_LABELS: Record<string, string> = {
  JAZZCASH: 'JazzCash',
  EASYPAISA: 'Easypaisa',
};

export default function AddFundsPage() {
  const [balance, setBalance] = useState(0);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [depositResult, setDepositResult] = useState<{ id: string } | null>(null);

  const [step, setStep] = useState<Step>(1);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  const selectedPaymentMethod = useMemo(
    () => methods.find((m) => m.method === selectedMethod) || null,
    [methods, selectedMethod]
  );

  const fetchData = useCallback(async () => {
    try {
      const [meRes, payRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/payment-settings'),
      ]);
      if (meRes.ok) {
        const json = await meRes.json();
        setBalance(json.data?.balance ?? 0);
      }
      if (payRes.ok) {
        const json = await payRes.json();
        const data = json.data;
        const list: PaymentMethod[] = [];
        for (const key of Object.keys(data)) {
          list.push(data[key]);
        }
        setMethods(list);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setScreenshot(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setScreenshotPreview(null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedMethod) {
      toast.error('Please select a payment method');
      return;
    }
    if (!amount || parseFloat(amount) < 1) {
      toast.error('Please enter a valid amount (minimum $1)');
      return;
    }
    if (!transactionId.trim()) {
      toast.error('Please enter the transaction/reference ID');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          paymentMethod: selectedMethod,
          transactionId: transactionId.trim(),
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setDepositResult({ id: json.data.id });
        toast.success('Deposit submitted for review!');
      } else {
        toast.error(json.error || 'Failed to submit deposit');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = useMemo(() => {
    switch (step) {
      case 1:
        return !!selectedMethod;
      case 2:
        return !!amount && parseFloat(amount) >= (selectedPaymentMethod?.minDeposit ?? 1);
      case 3:
        return true;
      case 4:
        return !!transactionId.trim();
      case 5:
        return true;
      default:
        return false;
    }
  }, [step, selectedMethod, amount, selectedPaymentMethod, transactionId]);

  const nextStep = () => {
    if (step < 5) setStep((step + 1) as Step);
  };

  const prevStep = () => {
    if (step > 1) setStep((step - 1) as Step);
  };

  const stepLabels = ['Method', 'Amount', 'Details', 'Reference', 'Confirm'];

  if (depositResult) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' as const }}
        >
          <div className="rounded-full bg-green-50 p-6 mx-auto w-fit">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>
          <h2 className="mt-6 text-xl font-bold text-slate-900">Deposit Submitted!</h2>
          <p className="mt-2 text-sm text-slate-500">
            Your deposit has been submitted for review. Your balance will be added after admin approval.
          </p>
          <Card className="mt-6 border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Deposit ID</span>
                <span className="font-mono text-xs text-slate-700">#{depositResult.id.slice(0, 12)}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-slate-500">Amount</span>
                <span className="font-semibold text-slate-900">{formatCurrency(parseFloat(amount))}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-slate-500">Method</span>
                <span className="text-slate-700">{METHOD_LABELS[selectedMethod] || selectedMethod}</span>
              </div>
            </CardContent>
          </Card>
          <div className="mt-6 rounded-lg bg-amber-50 border border-amber-200 p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 text-left">
                Your deposit will be reviewed by admin. Balance will be added after approval. This usually takes a few minutes to a few hours.
              </p>
            </div>
          </div>
          <Button
            className="mt-6 bg-indigo-600 hover:bg-indigo-700"
            onClick={() => {
              setDepositResult(null);
              setStep(1);
              setAmount('');
              setTransactionId('');
              setScreenshot(null);
              setScreenshotPreview(null);
              setSelectedMethod('');
              fetchData();
            }}
          >
            Submit Another Deposit
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Add Funds</h1>
        <p className="mt-1 text-sm text-slate-500">Deposit money into your account balance</p>
      </div>

      {/* Current Balance */}
      {loading ? (
        <Skeleton className="h-16 w-full" />
      ) : (
        <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-indigo-100 p-2.5">
                <Wallet className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-indigo-500 font-medium">Current Balance</p>
                <p className="text-xl font-bold text-indigo-600 tabular-nums">{formatCurrency(balance)}</p>
              </div>
            </div>
            <ArrowLeftRight className="h-5 w-5 text-indigo-300" />
          </CardContent>
        </Card>
      )}

      {/* Step Indicator */}
      <div className="flex items-center gap-1">
        {stepLabels.map((label, i) => {
          const stepNum = (i + 1) as Step;
          const isActive = step >= stepNum;
          const isCurrent = step === stepNum;
          return (
            <div key={label} className="flex-1 flex items-center">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                    isCurrent
                      ? 'bg-indigo-600 text-white'
                      : isActive
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {i + 1}
                </div>
                <span
                  className={`mt-1 text-[10px] sm:text-xs ${
                    isCurrent ? 'text-indigo-600 font-medium' : 'text-slate-400'
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < stepLabels.length - 1 && (
                <div
                  className={`h-px flex-1 mx-1 mb-5 ${
                    step > stepNum ? 'bg-indigo-300' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' as const }}
      >
        {loading ? (
          <Card className="border-slate-200">
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ) : (
          <Card className="border-slate-200">
            <CardContent className="p-6">
              {/* Step 1: Select Payment Method */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-indigo-600" />
                    <h3 className="text-lg font-semibold text-slate-900">Select Payment Method</h3>
                  </div>
                  {methods.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <AlertCircle className="h-8 w-8 text-slate-400" />
                      <p className="mt-2 text-sm text-slate-500">No payment methods available</p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {methods.map((m) => (
                        <button
                          key={m.method}
                          type="button"
                          onClick={() => setSelectedMethod(m.method)}
                          className={`flex items-center gap-4 rounded-lg border-2 p-4 text-left transition-all ${
                            selectedMethod === m.method
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-2xl">
                            {METHOD_ICONS[m.method] || '💳'}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-900">
                              {METHOD_LABELS[m.method] || m.method}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Min: {formatCurrency(m.minDeposit)} · Max: {formatCurrency(m.maxDeposit)}
                            </p>
                          </div>
                          {selectedMethod === m.method && (
                            <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Enter Amount */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-indigo-600" />
                    <h3 className="text-lg font-semibold text-slate-900">Enter Amount</h3>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (USD)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
                        $
                      </span>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="1.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min={selectedPaymentMethod?.minDeposit ?? 1}
                        max={selectedPaymentMethod?.maxDeposit ?? 50000}
                        step="0.01"
                        className="pl-7 text-lg font-semibold tabular-nums"
                      />
                    </div>
                    {selectedPaymentMethod && (
                      <p className="text-xs text-slate-400">
                        Minimum: {formatCurrency(selectedPaymentMethod.minDeposit)} · Maximum:{' '}
                        {formatCurrency(selectedPaymentMethod.maxDeposit)}
                      </p>
                    )}
                  </div>
                  {/* Quick amounts */}
                  <div className="flex flex-wrap gap-2">
                    {[1, 5, 10, 25, 50, 100].map((val) => (
                      <Button
                        key={val}
                        variant={amount === String(val) ? 'default' : 'outline'}
                        size="sm"
                        className={
                          amount === String(val)
                            ? 'bg-indigo-600 hover:bg-indigo-700'
                            : ''
                        }
                        onClick={() => setAmount(String(val))}
                      >
                        ${val}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Payment Info */}
              {step === 3 && selectedPaymentMethod && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-indigo-600" />
                    <h3 className="text-lg font-semibold text-slate-900">
                      Payment Details - {METHOD_LABELS[selectedMethod]}
                    </h3>
                  </div>
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-3">
                    {selectedPaymentMethod.accountName && (
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Account Name</p>
                        <p className="text-sm font-semibold text-slate-900 mt-0.5">
                          {selectedPaymentMethod.accountName}
                        </p>
                      </div>
                    )}
                    {selectedPaymentMethod.accountNumber && (
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Account Number</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-sm font-semibold text-slate-900 font-mono">
                            {selectedPaymentMethod.accountNumber}
                          </p>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(selectedPaymentMethod.accountNumber || '');
                              toast.success('Account number copied');
                            }}
                            className="text-slate-400 hover:text-slate-600"
                            title="Copy"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                    <Separator />
                    {selectedPaymentMethod.instructions && (
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">
                          Instructions
                        </p>
                        <p className="text-sm text-slate-700 mt-0.5 whitespace-pre-line">
                          {selectedPaymentMethod.instructions}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                    <div className="flex gap-3">
                      <Info className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700">
                        Send <span className="font-bold">{formatCurrency(parseFloat(amount))}</span> to the account
                        above and then proceed to enter your transaction ID.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Transaction ID */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-indigo-600" />
                    <h3 className="text-lg font-semibold text-slate-900">Transaction Reference</h3>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="txId">Transaction / Reference ID</Label>
                    <Input
                      id="txId"
                      placeholder="Enter the transaction ID from your payment receipt"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                    />
                    <p className="text-xs text-slate-400">
                      You can find this in your payment app&apos;s transaction history.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 5: Screenshot & Confirm */}
              {step === 5 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-indigo-600" />
                    <h3 className="text-lg font-semibold text-slate-900">Screenshot & Confirm</h3>
                  </div>
                  <div className="space-y-2">
                    <Label>Screenshot of Payment (Optional)</Label>
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer hover:border-indigo-300 ${
                        screenshotPreview ? 'border-indigo-300 bg-indigo-50/50' : 'border-slate-200'
                      }`}
                      onClick={() => document.getElementById('screenshot-input')?.click()}
                    >
                      {screenshotPreview ? (
                        <div className="space-y-2">
                          <img
                            src={screenshotPreview}
                            alt="Screenshot preview"
                            className="max-h-48 mx-auto rounded-md object-contain"
                          />
                          <p className="text-xs text-indigo-500">Click to change</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <ImageIcon className="h-8 w-8 text-slate-300 mx-auto" />
                          <p className="text-sm text-slate-500">
                            Click to upload screenshot
                          </p>
                          <p className="text-xs text-slate-400">PNG, JPG up to 5MB</p>
                        </div>
                      )}
                      <input
                        id="screenshot-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Summary */}
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-2">
                    <p className="text-sm font-semibold text-slate-700">Deposit Summary</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Method</span>
                      <span className="text-slate-900">
                        {METHOD_ICONS[selectedMethod] || ''} {METHOD_LABELS[selectedMethod] || selectedMethod}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Amount</span>
                      <span className="font-semibold text-indigo-600 tabular-nums">
                        {formatCurrency(parseFloat(amount))}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Transaction ID</span>
                      <span className="font-mono text-xs text-slate-700">{transactionId}</span>
                    </div>
                  </div>

                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                    <div className="flex gap-3">
                      <Info className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700">
                        Your deposit will be reviewed by admin. Balance will be added after approval.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={step === 1}
                >
                  Back
                </Button>
                {step < 5 ? (
                  <Button
                    className="bg-indigo-600 hover:bg-indigo-700"
                    onClick={nextStep}
                    disabled={!canProceed}
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    className="bg-indigo-600 hover:bg-indigo-700"
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Submit Deposit
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}

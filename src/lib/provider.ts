/*
 * Standard SMM Provider API Integration
 * Supports the common SMM panel API format:
 *   POST {apiUrl} with form-encoded body
 *   Response: { order, charge, start_count, status, remains } or { error }
 */

// ============================================================
// TYPES
// ============================================================

export interface Provider {
  apiUrl: string;
  apiKey: string;
}

export interface ProviderOrderResponse {
  order: number;
  charge: number;
  start_count?: number;
  status?: string;
}

export interface ProviderStatusResponse {
  charge: string;
  start_count: string;
  status: string;
  remains: string;
}

export interface ProviderCancelResponse {
  success?: boolean;
  error?: string;
}

export interface ProviderService {
  service: number;
  name: string;
  type: string;
  rate: number;
  min: number;
  max: number;
  category: string;
  description?: string;
  refill: boolean;
  cancel: boolean;
}

export interface ProviderBalanceResponse {
  balance: string;
  currency: string;
}

// ============================================================
// HELPER
// ============================================================

async function postToProvider(
  provider: Provider,
  params: Record<string, string>
): Promise<unknown> {
  const form = new URLSearchParams({ key: provider.apiKey, ...params });

  const res = await fetch(provider.apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });

  if (!res.ok) {
    throw new Error(`Provider API returned HTTP ${res.status}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(data.error || 'Provider rejected the request');
  }
  return data;
}

// ============================================================
// CREATE ORDER
// ============================================================

export async function createProviderOrder(
  provider: Provider,
  serviceId: string,
  link: string,
  quantity: number
): Promise<ProviderOrderResponse> {
  const data = await postToProvider(provider, {
    action: 'add',
    service: serviceId,
    link,
    quantity: quantity.toString(),
  });
  return data as ProviderOrderResponse;
}

// ============================================================
// GET ORDER STATUS
// ============================================================

export async function getProviderOrderStatus(
  provider: Provider,
  orderId: string
): Promise<ProviderStatusResponse> {
  const data = await postToProvider(provider, {
    action: 'status',
    order: orderId,
  });
  return data as ProviderStatusResponse;
}

// ============================================================
// CANCEL ORDER
// ============================================================

export async function cancelProviderOrder(
  provider: Provider,
  orderId: string
): Promise<ProviderCancelResponse> {
  const data = await postToProvider(provider, {
    action: 'cancel',
    order: orderId,
  });
  return data as ProviderCancelResponse;
}

// ============================================================
// GET SERVICES LIST
// ============================================================

export async function getProviderServices(
  provider: Provider
): Promise<ProviderService[]> {
  const data = await postToProvider(provider, {
    action: 'services',
  });
  return Array.isArray(data) ? (data as ProviderService[]) : [];
}

// ============================================================
// GET ACCOUNT BALANCE
// ============================================================

export async function getProviderBalance(
  provider: Provider
): Promise<{ balance: number; currency: string }> {
  const data = await postToProvider(provider, {
    action: 'balance',
  });
  const resp = data as { balance?: string | number; currency?: string };
  return {
    balance: Number(resp.balance || 0),
    currency: resp.currency || 'USD',
  };
}

// ============================================================
// TEST CONNECTION (convenience wrapper for admin UI)
// ============================================================

export async function testProviderConnection(
  provider: Provider
): Promise<{ success: boolean; balance?: number; error?: string }> {
  try {
    const result = await getProviderBalance(provider);
    return { success: true, balance: result.balance };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Connection failed',
    };
  }
}

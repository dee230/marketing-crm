// Nandi Creative CRM — API client
// With offline cache: reads fall back to cache, writes queue when offline
import { Paths, File } from 'expo-file-system';
import { getCached, setCached } from './cache';
import { isOnline, addPendingOp } from './offline-state';

// Change this to your deployed API URL
// For testing with Vercel preview, use your preview URL
// For production, use your production URL
const API_BASE = 'https://marketing-crm-ebon.vercel.app';

const SESSION_FILE = new File(Paths.document, 'session.json');

export async function getStoredSession(): Promise<string | null> {
  try {
    if (!SESSION_FILE.exists) return null;
    const data = await SESSION_FILE.text();
    if (!data) return null;
    const parsed = JSON.parse(data);
    return parsed.cookieValue || null;
  } catch {
    return null;
  }
}

export async function storeSession(cookieValue: string) {
  SESSION_FILE.write(JSON.stringify({ cookieValue }));
}

export async function clearSession() {
  try {
    if (SESSION_FILE.exists) SESSION_FILE.delete();
  } catch {
    // ignore
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const cookieValue = await getStoredSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (cookieValue) {
    headers['Cookie'] = `crm-session=${cookieValue}`;
  }
  return headers;
}

// ── Fetch wrapper ──

/** Low-level fetch helper. Exported so offline replay can reuse it. */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const headers = await getAuthHeaders();
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });
}

// ── Cache & queue helpers ──

/**
 * Fetch + cache pattern for read endpoints.
 * Tries network first. On failure, falls back to cached data.
 * Cache key is derived from `key` param (not the full URL, for cleanliness).
 */
async function fetchWithCache<T>(
  path: string,
  cacheKey: string,
  extractor: (json: any) => T,
  ttl?: number
): Promise<T> {
  try {
    const res = await apiFetch(path);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const data = extractor(json);
    // Update cache in background (don't block on write)
    setCached(cacheKey, data, ttl).catch(() => {});
    return data;
  } catch (err) {
    // Network or server error — try cache
    const cached = await getCached<T>(cacheKey);
    if (cached) return cached.data;
    throw err; // No cache available, re-throw
  }
}

/**
 * Write + queue pattern for mutation endpoints.
 * Tries network. On failure while offline, queues the operation for later replay.
 */
async function writeWithQueue(
  doFetch: () => Promise<Response>,
  opType: PendingOpType,
  opParams: Record<string, unknown>
): Promise<any> {
  try {
    const res = await doFetch();
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(errBody.error || 'Request failed');
    }
    return res.json();
  } catch (err) {
    // If we're offline (or health check hasn't caught up), queue
    if (!isOnline()) {
      await addPendingOp({ type: opType, params: opParams });
      return { _queued: true };
    }
    throw err;
  }
}

type PendingOpType =
  | 'createTask'
  | 'updateTaskStatus'
  | 'markInvoiceAsPaid'
  | 'updateClient'
  | 'updateLeadStatus';

// ── Auth ──

// Login — returns session user if successful
export async function loginUser(email: string, password: string) {
  const res = await apiFetch('/api/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (data.success) {
    // Capture the session token from the JSON response body (preferred).
    // React Native's Hermes fetch may not expose set-cookie headers to JS,
    // so the server also returns sessionToken in the response body.
    if (data.sessionToken) {
      await storeSession(data.sessionToken);
    } else {
      // Fallback: try to extract from set-cookie header
      const setCookie = res.headers.get('set-cookie');
      if (setCookie) {
        const match = setCookie.match(/crm-session=([^;]+)/);
        if (match) {
          await storeSession(match[1]);
        }
      }
    }
    return data.user;
  }
  throw new Error(data.error || 'Login failed');
}

// ── Dashboard ──

// Fetch dashboard stats (delegates to cached fetchClients/fetchTasks)
export async function fetchDashboardStats() {
  const [clients, tasks] = await Promise.all([fetchClients(), fetchTasks()]);
  return { clients, tasks };
}

// ── Clients ──

// Fetch clients
export async function fetchClients(query?: string) {
  const path = query ? `/api/clients?query=${encodeURIComponent(query)}` : '/api/clients';
  const cacheKey = query ? `clients_query_${query}` : 'clients';
  return fetchWithCache<any[]>(
    path,
    cacheKey,
    (json) => json.clients || json || [],
    5 * 60 * 1000 // 5 min TTL for list
  );
}

// Fetch single client detail
export async function fetchClientDetail(clientId: string) {
  return fetchWithCache<any>(
    `/api/clients/${clientId}`,
    `client_${clientId}`,
    (json) => json.client || json || null,
    2 * 60 * 1000 // 2 min TTL for detail
  );
}

// ── Invoices ──

// Fetch invoices
export async function fetchInvoices() {
  return fetchWithCache<any[]>(
    '/api/invoices',
    'invoices',
    (json) => json.invoices || json || [],
    5 * 60 * 1000
  );
}

// Fetch invoices for a specific client
export async function fetchClientInvoices(clientId: string) {
  const allInvoices = await fetchInvoices();
  return allInvoices.filter(
    (inv: any) => inv.clientId === clientId || inv.client_id === clientId
  );
}

// ── Tasks ──

// Fetch tasks
export async function fetchTasks() {
  return fetchWithCache<any[]>(
    '/api/tasks',
    'tasks',
    (json) => json.tasks || json || [],
    5 * 60 * 1000
  );
}

// Fetch tasks for a specific client
export async function fetchClientTasks(clientId: string) {
  const allTasks = await fetchTasks();
  return allTasks.filter((t: any) => t.clientId === clientId || t.client_id === clientId);
}

// Create a new task
export async function createTask(params: {
  title: string;
  description?: string;
  clientId?: string;
  priority?: string;
  status?: string;
  dueDate?: string;
}) {
  return writeWithQueue(
    () =>
      apiFetch('/api/tasks/create', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    'createTask',
    params as unknown as Record<string, unknown>
  );
}

// Update task status (cycles: pending → in-progress → completed)
export async function updateTaskStatus(taskId: string, newStatus: string) {
  return writeWithQueue(
    () =>
      apiFetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      }),
    'updateTaskStatus',
    { taskId, newStatus }
  );
}

// ── Leads ──

export async function fetchLeads() {
  return fetchWithCache<any[]>(
    '/api/leads',
    'leads',
    (json) => json.leads || json || [],
    5 * 60 * 1000
  );
}

export async function updateLeadStatus(leadId: string, newStatus: string) {
  return writeWithQueue(
    () =>
      apiFetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      }),
    'updateLeadStatus',
    { leadId, newStatus }
  );
}

export async function updateLead(leadId: string, data: Record<string, any>) {
  return writeWithQueue(
    () =>
      apiFetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    'updateLeadStatus',
    { leadId, ...data }
  );
}

// ── Client updates ──

export async function updateClient(clientId: string, data: Record<string, any>) {
  return writeWithQueue(
    () =>
      apiFetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    'updateClient',
    { clientId, ...data }
  );
}

// ── Invoice actions ──

export async function markInvoiceAsPaid(invoiceId: string, paymentReference?: string) {
  return writeWithQueue(
    () =>
      apiFetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'paid',
          paymentReference: paymentReference || null,
        }),
      }),
    'markInvoiceAsPaid',
    { invoiceId, paymentReference: paymentReference || null }
  );
}

// ── Push Notifications ──

export async function registerPushToken(pushToken: string) {
  const res = await apiFetch('/api/notifications/register', {
    method: 'POST',
    body: JSON.stringify({ pushToken }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to register push token' }));
    throw new Error(err.error || 'Failed to register push token');
  }
  return res.json();
}

export async function unregisterPushToken() {
  const res = await apiFetch('/api/notifications/register', {
    method: 'POST',
    body: JSON.stringify({ pushToken: null }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to unregister push token' }));
    console.error('Failed to unregister push token:', err.error);
  }
}

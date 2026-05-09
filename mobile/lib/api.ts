// Nandi Creative CRM — API client
import { Paths, File } from 'expo-file-system';
import { Platform } from 'react-native';

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

// Simple fetch wrapper
async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const headers = await getAuthHeaders();
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });
}

// Login — returns session user if successful
export async function loginUser(email: string, password: string) {
  const res = await apiFetch('/api/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (data.success) {
    // Capture the crm-session cookie from the response's set-cookie header.
    // React Native's fetch does NOT auto-send cookies, so we must manually
    // store the cookie value and send it with every subsequent request.
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      const match = setCookie.match(/crm-session=([^;]+)/);
      if (match) {
        await storeSession(match[1]);
      }
    }
    return data.user;
  }
  throw new Error(data.error || 'Login failed');
}

// Fetch dashboard stats
export async function fetchDashboardStats() {
  const cookieValue = await getStoredSession();
  if (!cookieValue) throw new Error('Not logged in');

  // Get clients count and data
  const clientsRes = await apiFetch('/api/clients');
  if (!clientsRes.ok) throw new Error('Failed to fetch clients');
  const clientsData = await clientsRes.json();
  
  // Get tasks
  const tasksRes = await apiFetch('/api/tasks');
  if (!tasksRes.ok) throw new Error('Failed to fetch tasks');
  const tasksData = await tasksRes.json();

  return {
    clients: clientsData.clients || clientsData || [],
    tasks: tasksData.tasks || tasksData || [],
  };
}

// Fetch clients
export async function fetchClients(query?: string) {
  const path = query ? `/api/clients?query=${encodeURIComponent(query)}` : '/api/clients';
  const res = await apiFetch(path);
  if (!res.ok) throw new Error('Failed to fetch clients');
  const data = await res.json();
  return data.clients || data || [];
}

// Fetch single client detail
export async function fetchClientDetail(clientId: string) {
  const res = await apiFetch(`/api/clients/${clientId}`);
  if (!res.ok) throw new Error('Failed to fetch client');
  const data = await res.json();
  return data.client || data || null;
}

// Fetch invoices
export async function fetchInvoices() {
  const res = await apiFetch('/api/invoices');
  if (!res.ok) throw new Error('Failed to fetch invoices');
  const data = await res.json();
  return data.invoices || data || [];
}

// Fetch tasks
export async function fetchTasks() {
  const res = await apiFetch('/api/tasks');
  if (!res.ok) throw new Error('Failed to fetch tasks');
  const data = await res.json();
  return data.tasks || data || [];
}

// Fetch invoices for a specific client
export async function fetchClientInvoices(clientId: string) {
  const allInvoices = await fetchInvoices();
  return allInvoices.filter((inv: any) => inv.clientId === clientId || inv.client_id === clientId);
}

// Fetch tasks for a specific client
export async function fetchClientTasks(clientId: string) {
  const allTasks = await fetchTasks();
  return allTasks.filter((t: any) => t.clientId === clientId || t.client_id === clientId);
}

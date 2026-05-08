// Nandi Creative CRM — API client
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Change this to your deployed API URL
// For testing with Vercel preview, use your preview URL
// For production, use your production URL
const API_BASE = 'https://marketing-crm-ebon.vercel.app';

const SESSION_KEY = 'crm_session_token';

export async function getStoredSession(): Promise<{ email: string; password: string } | null> {
  try {
    const data = await AsyncStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function storeSession(email: string, password: string) {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ email, password }));
}

export async function clearSession() {
  await AsyncStorage.removeItem(SESSION_KEY);
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const session = await getStoredSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (session) {
    // We handle auth by setting the session cookie manually
    // Fetch API on RN doesn't send cookies by default, so we login each time
    // or you can store the session cookie value
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
    await storeSession(email, password);
    return data.user;
  }
  throw new Error(data.error || 'Login failed');
}

// Fetch dashboard stats
export async function fetchDashboardStats() {
  const session = await getStoredSession();
  if (!session) throw new Error('Not logged in');

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

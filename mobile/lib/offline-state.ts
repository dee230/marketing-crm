// Offline state tracking + write queue for queuing mutations when offline
import { Paths, Directory, File } from 'expo-file-system';

const PENDING_DIR = new Directory(Paths.document, 'pending-ops');
const HEALTH_CHECK_URL = 'https://marketing-crm-ebon.vercel.app/api/clients';
const HEALTH_CHECK_INTERVAL = 15_000; // 15 s
const HEALTH_CHECK_TIMEOUT = 5_000; // 5 s

// ── Types ──

export type Listener = (online: boolean) => void;

export interface PendingOperation {
  id: string;
  type:
    | 'createTask'
    | 'updateTaskStatus'
    | 'markInvoiceAsPaid'
    | 'updateClient'
    | 'updateLeadStatus';
  params: Record<string, unknown>;
  timestamp: number;
}

// ── Internal state ──

let _online = true;
let _checkInterval: ReturnType<typeof setInterval> | null = null;
const _listeners: Set<Listener> = new Set();

function notify() {
  _listeners.forEach((fn) => fn(_online));
}

// ── Connectivity ──

async function checkConnectivity(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);
    const res = await fetch(HEALTH_CHECK_URL, { method: 'HEAD', signal: controller.signal });
    clearTimeout(timer);
    // 405 = Method Not Allowed means the endpoint exists (we just used HEAD)
    return res.ok || res.status === 405;
  } catch {
    return false;
  }
}

/** Run a single health check and update state. Returns current online status. */
export async function runHealthCheck(): Promise<boolean> {
  const online = await checkConnectivity();
  if (online !== _online) {
    _online = online;
    const wasOffline = !online;
    notify(); // 1st notify: tell UI we changed state
    if (wasOffline) {
      // Just came back online — replay queued writes
      await flushPendingOps();
      notify(); // 2nd notify: tell UI flush is done (UI re-queries pending count)
    }
  }
  return _online;
}

/** Start periodic health-check polling. */
export function startHealthCheck() {
  if (_checkInterval) return;
  runHealthCheck(); // immediate first check
  _checkInterval = setInterval(runHealthCheck, HEALTH_CHECK_INTERVAL);
}

/** Stop periodic health-check polling. */
export function stopHealthCheck() {
  if (_checkInterval) {
    clearInterval(_checkInterval);
    _checkInterval = null;
  }
}

/** Current online/offline status. */
export function isOnline(): boolean {
  return _online;
}

/** Subscribe to online/offline transitions. Returns unsubscribe function. */
export function onChange(fn: Listener): () => void {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

// ── Write Queue ──

function ensurePendingDir(): Directory {
  if (!PENDING_DIR.exists) {
    PENDING_DIR.create({ idempotent: true, intermediates: true });
  }
  return PENDING_DIR;
}

/** Queue a write operation for replay when back online. */
export async function addPendingOp(
  op: Omit<PendingOperation, 'id' | 'timestamp'>
): Promise<string> {
  const entry: PendingOperation = {
    ...op,
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
  };
  const dir = ensurePendingDir();
  const file = new File(dir, `${entry.id}.json`);
  file.write(JSON.stringify(entry));
  return entry.id;
}

/** List all pending write operations, oldest first. */
export async function getPendingOps(): Promise<PendingOperation[]> {
  try {
    if (!PENDING_DIR.exists) return [];
    const ops: PendingOperation[] = [];
    for (const entry of PENDING_DIR.list()) {
      if (entry instanceof File && entry.name.endsWith('.json')) {
        try {
          const raw = await entry.text();
          ops.push(JSON.parse(raw));
        } catch {
          // skip corrupt files
        }
      }
    }
    return ops.sort((a, b) => a.timestamp - b.timestamp);
  } catch {
    return [];
  }
}

/** Number of pending operations awaiting sync. */
export async function countPendingOps(): Promise<number> {
  try {
    if (!PENDING_DIR.exists) return 0;
    return PENDING_DIR.list().filter(
      (e) => e instanceof File && e.name.endsWith('.json')
    ).length;
  } catch {
    return 0;
  }
}

/** Remove a specific pending op (e.g. after dedup or manual discard). */
export async function removePendingOp(id: string): Promise<void> {
  try {
    const file = new File(PENDING_DIR, `${id}.json`);
    if (file.exists) file.delete();
  } catch {
    // best-effort
  }
}

// ── Replay (flush) ──

/** Replay all queued writes. Called automatically when coming back online. */
export async function flushPendingOps(): Promise<{ success: number; failed: number; total: number }> {
  const ops = await getPendingOps();
  let success = 0;
  let failed = 0;

  for (const op of ops) {
    try {
      await replayOne(op);
      await removePendingOp(op.id);
      success++;
    } catch {
      failed++;
    }
  }

  return { success, failed, total: ops.length };
}

/** Replay a single queued operation (uses the same fetch pattern as api.ts). */
async function replayOne(op: PendingOperation): Promise<void> {
  const baseUrl = 'https://marketing-crm-ebon.vercel.app';
  // Re-import auth helpers to get current session
  const { getStoredSession } = await import('./api');

  const cookieValue = await getStoredSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (cookieValue) {
    headers['Cookie'] = `crm-session=${cookieValue}`;
  }

  switch (op.type) {
    case 'createTask': {
      const res = await fetch(`${baseUrl}/api/tasks/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify(op.params),
      });
      if (!res.ok) throw new Error(`createTask failed: ${res.status}`);
      break;
    }
    case 'updateTaskStatus': {
      const { taskId, newStatus } = op.params as any;
      const res = await fetch(`${baseUrl}/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error(`updateTaskStatus failed: ${res.status}`);
      break;
    }
    case 'markInvoiceAsPaid': {
      const { invoiceId, paymentReference } = op.params as any;
      const res = await fetch(`${baseUrl}/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: 'paid', paymentReference: paymentReference ?? null }),
      });
      if (!res.ok) throw new Error(`markInvoiceAsPaid failed: ${res.status}`);
      break;
    }
    case 'updateClient': {
      const { clientId, ...data } = op.params as any;
      const res = await fetch(`${baseUrl}/api/clients/${clientId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`updateClient failed: ${res.status}`);
      break;
    }
    case 'updateLeadStatus': {
      const { leadId, newStatus, status: statusField } = op.params as any;
      const res = await fetch(`${baseUrl}/api/leads/${leadId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: newStatus ?? statusField }),
      });
      if (!res.ok) throw new Error(`updateLeadStatus failed: ${res.status}`);
      break;
    }
    default:
      throw new Error(`Unknown operation type: ${(op as any).type}`);
  }
}

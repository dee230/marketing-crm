// Push notification helper — sends via Expo Push API
import { sqlRaw } from '@/db';

const EXPO_PUSH_API = 'https://exp.host/--/api/v2/push/send';

interface PushPayload {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: string;
  priority?: 'default' | 'normal' | 'high';
}

interface ExpoPushResponse {
  data: {
    status: 'ok' | 'error';
    id?: string;
    message?: string;
  }[];
  errors?: { code: string; message: string }[];
}

/**
 * Send a push notification directly to an Expo push token.
 */
export async function sendPushToToken(
  pushToken: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<boolean> {
  try {
    const payload: PushPayload = {
      to: pushToken,
      title,
      body,
      data,
      sound: 'default',
      priority: 'high',
    };

    const res = await fetch(EXPO_PUSH_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error(`Expo Push API error: ${res.status} ${res.statusText}`);
      return false;
    }

    const result: ExpoPushResponse = await res.json();

    // Check the response status
    if (result.data?.[0]?.status === 'ok') {
      return true;
    }

    // Log but don't throw — push is best-effort
    if (result.data?.[0]?.message) {
      console.error('Expo push error:', result.data[0].message);
    }

    return false;
  } catch (error) {
    console.error('Failed to send push notification:', error);
    return false;
  }
}

/**
 * Look up a user's push token and send them a notification.
 * Silently skips if user has no push token registered.
 */
export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<boolean> {
  try {
    const rows = await sqlRaw`
      SELECT push_token FROM users WHERE id = ${userId} AND push_token IS NOT NULL LIMIT 1
    `;

    if (!rows || rows.length === 0 || !rows[0].push_token) {
      return false; // No push token for this user
    }

    return sendPushToToken(rows[0].push_token, title, body, data);
  } catch (error) {
    console.error('Failed to send push to user:', error);
    return false;
  }
}

/**
 * Send a notification that a task was assigned.
 */
export async function notifyTaskAssigned(taskId: string, title: string, assigneeId: string, assignedByName: string) {
  return sendPushToUser(
    assigneeId,
    'New Task Assigned',
    `${assignedByName} assigned you: ${title}`,
    { taskId, type: 'task_assigned' }
  );
}

/**
 * Send a notification that a task status changed.
 */
export async function notifyTaskStatusChanged(
  taskId: string,
  taskTitle: string,
  newStatus: string,
  changedByName: string,
  targetUserId: string
) {
  const statusLabel = newStatus === 'in-progress' ? 'started' : newStatus === 'completed' ? 'completed' : 'updated';

  return sendPushToUser(
    targetUserId,
    `Task ${statusLabel}`,
    `${changedByName} marked "${taskTitle}" as ${newStatus}`,
    { taskId, type: 'task_status_changed', status: newStatus }
  );
}

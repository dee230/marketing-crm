import Link from 'next/link';

interface ActivityItem {
  id: string;
  type: 'lead' | 'task' | 'invoice' | 'client';
  action: 'created' | 'updated' | 'completed' | 'converted';
  name: string;
  timestamp: Date;
  details?: string;
}

interface ActivityFeedProps {
  recentLeads: any[];
  recentTasks: any[];
  recentInvoices: any[];
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'lead':
      return (
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(129, 178, 154, 0.15)' }}>
          <svg className="w-4 h-4" style={{ color: '#81B29A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
      );
    case 'task':
      return (
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(242, 204, 143, 0.2)' }}>
          <svg className="w-4 h-4" style={{ color: '#B8923D' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
      );
    case 'invoice':
      return (
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(61, 64, 91, 0.15)' }}>
          <svg className="w-4 h-4" style={{ color: '#3D405B' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      );
    default:
      return (
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(224, 122, 95, 0.15)' }}>
          <svg className="w-4 h-4" style={{ color: '#E07A5F' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
  }
}

function formatTimeAgo(date: Date) {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString();
}

export function ActivityFeed({ recentLeads, recentTasks, recentInvoices }: ActivityFeedProps) {
  // Build activity list from recent items
  const activities: ActivityItem[] = [];

  // Add recent leads
  recentLeads.forEach(lead => {
    activities.push({
      id: `lead-${lead.id}`,
      type: 'lead',
      action: 'created',
      name: lead.name,
      timestamp: lead.createdAt,
      details: lead.status !== 'new' ? `Status: ${lead.status}` : undefined,
    });
  });

  // Add recent tasks
  recentTasks.forEach(task => {
    activities.push({
      id: `task-${task.id}`,
      type: 'task',
      action: task.status === 'completed' ? 'completed' : 'created',
      name: task.title,
      timestamp: task.status === 'completed' ? (task.completedAt || task.createdAt) : task.createdAt,
    });
  });

  // Add recent invoices
  recentInvoices.forEach(invoice => {
    activities.push({
      id: `invoice-${invoice.id}`,
      type: 'invoice',
      action: invoice.status === 'paid' ? 'completed' : 'created',
      name: invoice.invoiceNumber,
      details: `$${invoice.amount.toFixed(2)}`,
    });
  });

  // Sort by timestamp (newest first)
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Take only the 10 most recent
  const recentActivity = activities.slice(0, 10);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created': return '#81B29A';
      case 'updated': return '#B8923D';
      case 'completed': return '#3D405B';
      case 'converted': return '#E07A5F';
      default: return '#9B9B8F';
    }
  };

  return (
    <div className="card p-6 mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold" style={{ color: '#2D2A26' }}>Recent Activity</h2>
      </div>

      {recentActivity.length === 0 ? (
        <p className="text-sm" style={{ color: '#9B9B8F' }}>No recent activity yet.</p>
      ) : (
        <div className="space-y-4">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              {getActivityIcon(activity.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm" style={{ color: '#2D2A26' }}>
                  <span className="font-medium">{activity.name}</span>
                  {' '}
                  <span style={{ color: getActionColor(activity.action) }}>
                    {activity.action === 'created' ? 'was created' : 
                     activity.action === 'completed' ? 'was completed' : 
                     activity.action === 'converted' ? 'was converted to client' : 'was updated'}
                  </span>
                </p>
                {activity.details && (
                  <p className="text-xs" style={{ color: '#9B9B8F' }}>{activity.details}</p>
                )}
              </div>
              <span className="text-xs whitespace-nowrap" style={{ color: '#9B9B8F' }}>
                {formatTimeAgo(activity.timestamp)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
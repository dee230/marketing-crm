'use client';

interface StatusData {
  status: string;
  count: number;
}

interface LeadsChartProps {
  leads: StatusData[];
}

export function LeadsStatusChart({ leads }: LeadsChartProps) {
  const maxCount = Math.max(...leads.map(l => l.count), 1);
  
  const statusColors: Record<string, string> = {
    new: '#E07A5F',
    contacted: '#81B29A',
    qualified: '#3D405B',
    converted: '#B8923D',
    lost: '#9B9B8F',
  };

  const total = leads.reduce((sum, l) => sum + l.count, 0);

  return (
    <div className="card p-6">
      <h3 className="text-sm font-medium mb-4" style={{ color: '#9B9B8F' }}>
        Leads by Status
      </h3>
      
      {/* Simple bar chart */}
      <div className="space-y-3">
        {leads.map((item) => {
          const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
          const color = statusColors[item.status] || '#E8E4DD';
          
          return (
            <div key={item.status} className="relative">
              <div className="flex justify-between text-sm mb-1">
                <span style={{ color: '#2D2A26', textTransform: 'capitalize' }}>
                  {item.status}
                </span>
                <span style={{ color: '#9B9B8F' }}>
                  {item.count} ({total > 0 ? Math.round((item.count / total) * 100) : 0}%)
                </span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ background: '#E8E4DD' }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${percentage}%`,
                    background: color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Summary */}
      <div className="mt-4 pt-4" style={{ borderTop: '1px solid #E8E4DD' }}>
        <div className="flex justify-between text-sm">
          <span style={{ color: '#9B9B8F' }}>Total Leads</span>
          <span className="font-medium" style={{ color: '#2D2A26' }}>{total}</span>
        </div>
      </div>
    </div>
  );
}
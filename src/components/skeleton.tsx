'use client';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export function Skeleton({ className = '', variant = 'rectangular' }: SkeletonProps) {
  const baseClasses = 'animate-pulse';
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{ backgroundColor: '#E8E4DD' }}
    />
  );
}

export function TableSkeleton({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="card overflow-hidden">
      <table>
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i}>
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex}>
                  <Skeleton 
                    className="h-4" 
                    variant={colIndex === 0 ? 'text' : 'text'} 
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CardSkeleton({ height = '200px' }: { height?: string }) {
  return (
    <div 
      className="card p-8"
      style={{ height }}
    >
      <div className="space-y-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-20" variant="text" />
        <Skeleton className="h-8 w-8" variant="circular" />
      </div>
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-24 mt-2" />
    </div>
  );
}

export function FilterSkeleton() {
  return (
    <div className="flex gap-3 mb-4">
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-10 w-24" />
    </div>
  );
}
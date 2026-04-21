import { TableSkeleton, FilterSkeleton } from '@/components/skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen" style={{ background: '#FDFBF7' }}>
      {/* Top Navigation Skeleton */}
      <nav style={{ background: '#FFFFFF', borderBottom: '1px solid #E8E4DD' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg" style={{ background: '#E8E4DD' }} />
              <div className="h-6 w-32 rounded" style={{ background: '#E8E4DD' }} />
            </div>
            <div className="hidden md:flex items-center gap-1">
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <div key={i} className="h-4 w-16 rounded mx-2" style={{ background: '#E8E4DD' }} />
              ))}
            </div>
            <div className="flex items-center gap-4">
              <div className="h-4 w-32 rounded" style={{ background: '#E8E4DD' }} />
              <div className="h-8 w-8 rounded-full" style={{ background: '#E8E4DD' }} />
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar Skeleton */}
        <aside className="w-64 min-h-screen" style={{ background: '#FFFFFF', borderRight: '1px solid #E8E4DD' }}>
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="h-8 rounded" style={{ background: '#E8E4DD' }} />
            ))}
          </div>
        </aside>

        <main className="flex-1 p-8">
          {/* Header Skeleton */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="h-7 w-28 rounded mb-2" style={{ background: '#E8E4DD' }} />
              <div className="h-4 w-44 rounded" style={{ background: '#E8E4DD' }} />
            </div>
            <div className="flex gap-3">
              <div className="h-10 w-64 rounded-lg" style={{ background: '#E8E4DD' }} />
              <div className="h-10 w-28 rounded-lg" style={{ background: '#E8E4DD' }} />
            </div>
          </div>

          <FilterSkeleton />
          <TableSkeleton rows={5} columns={3} />
        </main>
      </div>
    </div>
  );
}
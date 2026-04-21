'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

export function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`${basePath}?${params.toString()}`);
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showEllipsisStart = currentPage > 3;
    const showEllipsisEnd = currentPage < totalPages - 2;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (showEllipsisStart) pages.push('...');
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) pages.push(i);
      
      if (showEllipsisEnd) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 rounded-lg border text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ borderColor: '#E8E4DD', color: '#2D2A26' }}
      >
        Previous
      </button>
      
      <div className="flex items-center gap-1">
        {getPageNumbers().map((page, idx) => (
          typeof page === 'number' ? (
            <button
              key={idx}
              onClick={() => goToPage(page)}
              className="px-3 py-2 rounded-lg text-sm"
              style={{
                background: page === currentPage ? '#E07A5F' : 'transparent',
                color: page === currentPage ? '#FFFFFF' : '#2D2A26',
                border: `1px solid ${page === currentPage ? '#E07A5F' : '#E8E4DD'}`,
              }}
            >
              {page}
            </button>
          ) : (
            <span key={idx} className="px-2" style={{ color: '#9B9B8F' }}>...</span>
          )
        ))}
      </div>
      
      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 rounded-lg border text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ borderColor: '#E8E4DD', color: '#2D2A26' }}
      >
        Next
      </button>
    </div>
  );
}
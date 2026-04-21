'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

interface SearchInputProps {
  placeholder?: string;
  basePath: string;
  debounceMs?: number;
}

export function SearchInput({ placeholder = 'Search...', basePath, debounceMs = 300 }: SearchInputProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('search') || '');

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      
      if (query.trim()) {
        params.set('search', query.trim());
      } else {
        params.delete('search');
      }
      
      // Reset to page 1 when searching
      params.set('page', '1');
      
      router.push(`${basePath}?${params.toString()}`);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs, searchParams, router, basePath]);

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-64 px-4 py-2 pl-10 rounded-lg border text-sm"
        style={{ 
          borderColor: '#E8E4DD', 
          background: '#FFFFFF', 
          color: '#2D2A26' 
        }}
      />
      <svg 
        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" 
        style={{ color: '#9B9B8F' }}
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
  );
}
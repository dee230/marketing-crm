'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignInPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const response = await fetch('/api/custom-signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setError(data.error || 'Invalid email or password');
      }
    } catch (err) {
      setError('Unable to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FDFBF7 0%, #F5F0E8 100%)' }}>
      <div className="w-full max-w-md p-8" style={{ background: '#FFFFFF', borderRadius: '1rem', boxShadow: '0 8px 32px rgba(45, 42, 38, 0.12)' }}>
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ background: '#E07A5F' }}>
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#2D2A26' }}>Nandi Creative</h1>
          <p className="text-sm mt-1" style={{ color: '#9B9B8F' }}>Marketing CRM</p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 rounded-lg text-sm" style={{ background: 'rgba(224, 122, 95, 0.15)', color: '#C96A52' }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: '#3D405B' }}>
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              placeholder="Enter your email"
              style={{ 
                background: '#FDFBF7', 
                border: '1px solid #E8E4DD',
                borderRadius: '0.5rem'
              }}
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: '#3D405B' }}>
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              placeholder="Enter your password"
              style={{ 
                background: '#FDFBF7', 
                border: '1px solid #E8E4DD',
                borderRadius: '0.5rem'
              }}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 hover:translate-y-[-1px] disabled:opacity-50"
            style={{ 
              background: '#E07A5F', 
              color: 'white',
              boxShadow: '0 4px 12px rgba(224, 122, 95, 0.3)'
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div className="text-center mt-4">
          <Link href="/forgot-password" className="text-sm" style={{ color: '#E07A5F' }}>
            Forgot Password?
          </Link>
        </div>
        
        <p className="text-center text-sm mt-6" style={{ color: '#9B9B8F' }}>
          Where strategy meets creativity
        </p>
      </div>
    </div>
  );
}
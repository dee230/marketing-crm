'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#2D2A26' }}>Invalid Request</h1>
        <p className="text-sm mb-6" style={{ color: '#9B9B8F' }}>
          No reset token provided. Please request a password reset from the sign-in page.
        </p>
        <Link href="/sign-in" className="text-sm" style={{ color: '#E07A5F' }}>
          Back to Sign In
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ background: 'rgba(129, 178, 154, 0.15)' }}>
          <svg className="w-8 h-8" style={{ color: '#81B29A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#2D2A26' }}>Password Reset Successful</h1>
        <p className="text-sm mb-6" style={{ color: '#9B9B8F' }}>
          Your password has been reset. You can now sign in with your new password.
        </p>
        <Link href="/sign-in" className="text-sm" style={{ color: '#E07A5F' }}>
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="mb-6 p-4 rounded-lg text-sm" style={{ background: 'rgba(224, 122, 95, 0.15)', color: '#C96A52' }}>
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: '#3D405B' }}>
            New Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Enter new password (min 6 characters)"
            style={{ 
              background: '#FDFBF7', 
              border: '1px solid #E8E4DD',
              borderRadius: '0.5rem'
            }}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2" style={{ color: '#3D405B' }}>
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Confirm new password"
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
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
      
      <p className="text-center text-sm mt-6" style={{ color: '#9B9B8F' }}>
        <Link href="/sign-in" style={{ color: '#E07A5F' }}>Back to Sign In</Link>
      </p>
    </>
  );
}

export default function ResetPasswordPage() {
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
          <h1 className="text-2xl font-bold" style={{ color: '#2D2A26' }}>Reset Your Password</h1>
          <p className="text-sm mt-1" style={{ color: '#9B9B8F' }}>Enter your new password</p>
        </div>
        
        <Suspense fallback={
          <div className="text-center py-8">
            <p style={{ color: '#9B9B8F' }}>Loading...</p>
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
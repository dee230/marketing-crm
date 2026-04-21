'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';

const INACTIVE_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds
const WARNING_TIME = 60 * 1000; // Show warning 1 minute before logout

export function SessionTimeout() {
  const { data: session, status } = useSession();
  const [showWarning, setShowWarning] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const isAuthenticated = status === 'authenticated';

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
      warningRef.current = null;
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await signOut({ callbackUrl: '/sign-in?timeout=true', redirect: true });
    } catch {
      // If signOut fails, try direct redirect
      window.location.href = '/sign-in?timeout=true';
    }
  }, []);

  // Start/stop timers based on authentication status
  useEffect(() => {
    if (!isAuthenticated) {
      clearTimers();
      setShowWarning(false);
      return;
    }

    // Clear any existing timers first
    clearTimers();

    // Set warning timer (show warning 1 minute before logout)
    warningRef.current = setTimeout(() => {
      setShowWarning(true);
    }, INACTIVE_TIMEOUT - WARNING_TIME);

    // Set logout timer
    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, INACTIVE_TIMEOUT);

    // Cleanup on unmount or when auth status changes
    return clearTimers;
  }, [isAuthenticated, clearTimers, handleLogout]);

  // Handle user activity to reset timers
  const handleActivity = useCallback(() => {
    if (!isAuthenticated) return;

    // Clear existing timers
    clearTimers();
    setShowWarning(false);

    // Reset timers
    warningRef.current = setTimeout(() => {
      setShowWarning(true);
    }, INACTIVE_TIMEOUT - WARNING_TIME);

    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, INACTIVE_TIMEOUT);
  }, [isAuthenticated, clearTimers, handleLogout]);

  // Add activity listeners
  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [isAuthenticated, handleActivity]);

  // Don't render anything if not authenticated or no warning
  if (!isAuthenticated || !showWarning) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md mx-4 animate-fade-in">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(224, 122, 95, 0.15)' }}>
            <svg className="w-6 h-6" style={{ color: '#E07A5F' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold" style={{ color: '#2D2A26' }}>
              Session Expiring
            </h3>
            <p className="text-sm" style={{ color: '#9B9B8F' }}>
              You will be logged out due to inactivity
            </p>
          </div>
        </div>
        
        <p className="mb-6" style={{ color: '#2D2A26' }}>
          For your security, you will be automatically logged out due to inactivity. 
          Move your mouse, type, or click to stay logged in.
        </p>
        
        <div className="flex gap-3">
          <button
            onClick={() => signOut({ callbackUrl: '/sign-in' })}
            className="flex-1 px-4 py-2 rounded-lg border transition-colors"
            style={{ borderColor: '#E8E4DD', color: '#2D2A26' }}
          >
            Log Out Now
          </button>
          <button
            onClick={() => {
              setShowWarning(false);
              // Manually reset timers
              clearTimers();
              
              warningRef.current = setTimeout(() => {
                setShowWarning(true);
              }, INACTIVE_TIMEOUT - WARNING_TIME);

              timeoutRef.current = setTimeout(() => {
                handleLogout();
              }, INACTIVE_TIMEOUT);
            }}
            className="flex-1 px-4 py-2 rounded-lg btn-primary"
          >
            Stay Logged In
          </button>
        </div>
      </div>
    </div>
  );
}
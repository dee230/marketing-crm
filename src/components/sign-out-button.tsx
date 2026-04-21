'use client';

import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/sign-in' });
    router.push('/sign-in');
  };

  return (
    <button 
      onClick={handleSignOut}
      className="text-sm px-3 py-1 rounded-lg sign-out-btn"
    >
      Sign Out
    </button>
  );
}
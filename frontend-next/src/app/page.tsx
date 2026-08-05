'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user) router.replace(user.role === 'provider' ? '/dashboard' : '/home');
    else router.replace('/login');
  }, [user, loading, router]);

  return <LoadingSpinner />;
}

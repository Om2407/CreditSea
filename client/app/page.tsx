'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      window.location.href = '/auth/login';
      return;
    }
    if (user?.role === 'borrower') {
      window.location.href = '/borrower/dashboard';
    } else {
      window.location.href = '/dashboard';
    }
  }, [isLoading, isAuthenticated, user]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0a0a0f' }}>
      <div style={{ width: 40, height: 40, border: '3px solid #4f6ef7', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/ui';

export default function BorrowerLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) { window.location.href = '/auth/login'; return; }
    if (user?.role !== 'borrower') { window.location.href = '/dashboard'; }
  }, [isLoading, isAuthenticated, user]);

  if (isLoading || !isAuthenticated) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f' }}>
      <Spinner size={32} />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f' }}>
      <nav style={{ background: '#16161f', borderBottom: '1px solid #2a2a3a', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#4f6ef7,#7c3aed)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>💳</div>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#f0f0f8' }}>LoanFlow</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link href="/borrower/dashboard" style={{ color: '#8b8ba7', fontSize: 14, textDecoration: 'none', fontWeight: 500 }}>My Loans</Link>
          <Link href="/borrower/apply" style={{ color: '#8b8ba7', fontSize: 14, textDecoration: 'none', fontWeight: 500 }}>Apply</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg,#4f6ef7,#7c3aed)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white' }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <span style={{ fontSize: 13, color: '#8b8ba7' }}>{user?.name}</span>
            <button onClick={() => { logout(); window.location.href = '/auth/login'; }}
              style={{ background: 'transparent', border: '1px solid #2a2a3a', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: '#5a5a72', fontSize: 12, fontWeight: 500 }}>
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
        {children}
      </main>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/ui';
import { UserRole } from '@/types';

const NAV_ITEMS: { label: string; href: string; icon: string; roles: UserRole[] }[] = [
  { label: 'Overview',     href: '/dashboard',              icon: '📊', roles: ['admin'] },
  { label: 'Sales',        href: '/dashboard/sales',        icon: '🎯', roles: ['admin','sales'] },
  { label: 'Sanction',     href: '/dashboard/sanction',     icon: '✅', roles: ['admin','sanction'] },
  { label: 'Disbursement', href: '/dashboard/disbursement', icon: '💸', roles: ['admin','disbursement'] },
  { label: 'Collection',   href: '/dashboard/collection',   icon: '💰', roles: ['admin','collection'] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated, logout, token } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    
    // Double check localStorage to avoid hydration race conditions
    const hasToken = !!token || !!localStorage.getItem('lms_token');
    
    if (!isAuthenticated && !hasToken) {
      window.location.href = '/auth/login';
      return;
    }
    
    if (user?.role === 'borrower') {
      window.location.href = '/borrower/dashboard';
    }
  }, [isLoading, isAuthenticated, user, token]);

  if (isLoading || !isAuthenticated) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f' }}>
      <Spinner size={32} />
    </div>
  );

  const visibleNav = NAV_ITEMS.filter(n => user?.role && n.roles.includes(user.role));

  const roleColors: Record<string, string> = {
    admin: '#4f6ef7', sales: '#f59e0b', sanction: '#22c55e',
    disbursement: '#c084fc', collection: '#f87171',
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0f' }}>
      <aside style={{ width: 220, background: '#16161f', borderRight: '1px solid #2a2a3a', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', flexShrink: 0 }}>
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #2a2a3a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#4f6ef7,#7c3aed)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>💳</div>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#f0f0f8' }}>LoanFlow</span>
          </div>
          <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, background: `${roleColors[user?.role || 'admin']}18`, border: `1px solid ${roleColors[user?.role || 'admin']}33`, borderRadius: 6, padding: '3px 8px' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: roleColors[user?.role || 'admin'], display: 'inline-block' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: roleColors[user?.role || 'admin'], textTransform: 'capitalize' }}>{user?.role}</span>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          {visibleNav.map(item => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, marginBottom: 2,
                  textDecoration: 'none', fontSize: 13, fontWeight: active ? 600 : 500,
                  background: active ? 'rgba(79,110,247,0.12)' : 'transparent',
                  color: active ? '#4f6ef7' : '#8b8ba7',
                  borderLeft: active ? '2px solid #4f6ef7' : '2px solid transparent',
                  transition: 'all 0.15s',
                }}>
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '12px 14px', borderTop: '1px solid #2a2a3a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#4f6ef7,#7c3aed)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0 }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#f0f0f8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</p>
              <p style={{ fontSize: 11, color: '#5a5a72', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</p>
            </div>
          </div>
          <button onClick={() => { logout(); window.location.href = '/auth/login'; }}
            style={{ width: '100%', background: 'transparent', border: '1px solid #2a2a3a', borderRadius: 6, padding: '6px 0', cursor: 'pointer', color: '#5a5a72', fontSize: 12, fontWeight: 500 }}>
            Sign Out
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: 28, overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}

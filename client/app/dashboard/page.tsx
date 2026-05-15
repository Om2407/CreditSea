'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, Spinner } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';

interface Stats {
  totalBorrowers: number;
  applied: number;
  sanctioned: number;
  disbursed: number;
  closed: number;
  rejected: number;
  totalCollected: number;
}

export default function DashboardOverview() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin') {
      // Redirect non-admin to their module
      const moduleMap: Record<string, string> = {
        sales: '/dashboard/sales',
        sanction: '/dashboard/sanction',
        disbursement: '/dashboard/disbursement',
        collection: '/dashboard/collection',
      };
      if (user?.role && moduleMap[user.role]) router.replace(moduleMap[user.role]);
      return;
    }
    api.get('/dashboard/stats').then(r => { setStats(r.data.stats); setLoading(false); }).catch(() => setLoading(false));
  }, [user, router]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><Spinner size={32} /></div>;

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f0f0f8', marginBottom: 4 }}>Operations Overview</h1>
      <p style={{ color: '#5a5a72', fontSize: 14, marginBottom: 32 }}>Platform-wide loan pipeline summary.</p>

      {stats && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 32 }}>
            {[
              { label: 'Total Borrowers', value: stats.totalBorrowers, icon: '👥', color: '#60a5fa' },
              { label: 'Applied', value: stats.applied, icon: '📋', color: '#f59e0b' },
              { label: 'Sanctioned', value: stats.sanctioned, icon: '✅', color: '#4ade80' },
              { label: 'Disbursed', value: stats.disbursed, icon: '💸', color: '#c084fc' },
              { label: 'Closed', value: stats.closed, icon: '🔒', color: '#86efac' },
              { label: 'Rejected', value: stats.rejected, icon: '❌', color: '#f87171' },
            ].map(s => (
              <Card key={s.label} style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 20 }}>{s.icon}</span>
                </div>
                <p style={{ fontSize: 28, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</p>
                <p style={{ fontSize: 12, color: '#5a5a72', fontWeight: 500 }}>{s.label}</p>
              </Card>
            ))}
          </div>

          <Card>
            <p style={{ color: '#5a5a72', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Total Collections</p>
            <p style={{ fontSize: 32, fontWeight: 800, color: '#4f6ef7' }}>{formatCurrency(stats.totalCollected)}</p>
            <p style={{ color: '#5a5a72', fontSize: 13, marginTop: 4 }}>Total payments recorded across all loans</p>
          </Card>
        </>
      )}
    </div>
  );
}

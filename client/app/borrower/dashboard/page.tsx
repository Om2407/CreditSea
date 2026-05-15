'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Loan } from '@/types';
import { StatusBadge, Card, EmptyState, Spinner } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function BorrowerDashboard() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/loans/my-loans').then(r => { setLoans(r.data.loans); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const activeLoan = loans.find(l => ['applied','sanctioned','disbursed'].includes(l.status));

  return (
    <div style={{ paddingTop: 8 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#f0f0f8', marginBottom: 4 }}>
          Hello, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: '#5a5a72', fontSize: 14 }}>Track your loan applications and repayments.</p>
      </div>

      {/* BRE Rejected Banner */}
      {user?.breStatus === 'rejected' && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
          <p style={{ color: '#ef4444', fontWeight: 600, fontSize: 14, marginBottom: 4 }}>❌ Eligibility Check Failed</p>
          <p style={{ color: '#f87171', fontSize: 13 }}>{user.breRejectionReason}</p>
        </div>
      )}

      {/* Active Loan Summary */}
      {activeLoan && (
        <div style={{ background: 'linear-gradient(135deg,rgba(79,110,247,0.12),rgba(124,58,237,0.08))', border: '1px solid rgba(79,110,247,0.25)', borderRadius: 16, padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <p style={{ color: '#8b8ba7', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Active Loan</p>
              <p style={{ fontSize: 32, fontWeight: 800, color: '#f0f0f8', marginBottom: 4 }}>{formatCurrency(activeLoan.amount)}</p>
              <p style={{ color: '#8b8ba7', fontSize: 13 }}>{activeLoan.tenure} days • {activeLoan.interestRate}% p.a.</p>
            </div>
            <StatusBadge status={activeLoan.status} />
          </div>
          {activeLoan.status === 'disbursed' && (
            <div style={{ marginTop: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <p style={{ color: '#5a5a72', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Total Repayment</p>
                <p style={{ color: '#f0f0f8', fontSize: 15, fontWeight: 700 }}>{formatCurrency(activeLoan.totalRepayment)}</p>
              </div>
              <div>
                <p style={{ color: '#5a5a72', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Total Paid</p>
                <p style={{ color: '#4ade80', fontSize: 15, fontWeight: 700 }}>{formatCurrency(activeLoan.totalPaid)}</p>
              </div>
              <div>
                <p style={{ color: '#5a5a72', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Outstanding</p>
                <p style={{ color: '#f59e0b', fontSize: 15, fontWeight: 700 }}>{formatCurrency(activeLoan.outstandingBalance)}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 32 }}>
        {[
          { label: 'Total Applied', value: loans.length, color: '#60a5fa' },
          { label: 'Active', value: loans.filter(l => ['applied','sanctioned','disbursed'].includes(l.status)).length, color: '#c084fc' },
          { label: 'Closed', value: loans.filter(l => l.status === 'closed').length, color: '#4ade80' },
          { label: 'Rejected', value: loans.filter(l => l.status === 'rejected').length, color: '#f87171' },
        ].map(s => (
          <Card key={s.label} style={{ padding: '16px 20px' }}>
            <p style={{ color: '#5a5a72', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{s.label}</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Loans list */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f0f0f8' }}>Loan History</h2>
        {!activeLoan && (
          <Link href="/borrower/apply" style={{ background: '#4f6ef7', color: 'white', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            + Apply for Loan
          </Link>
        )}
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spinner size={28} /></div>
        ) : loans.length === 0 ? (
          <EmptyState icon="📋" title="No loan applications yet" message="Click 'Apply for Loan' to get started." />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2a2a3a' }}>
                {['Amount', 'Tenure', 'Total Repayment', 'Applied On', 'Status'].map(h => (
                  <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#5a5a72', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loans.map(loan => (
                <tr key={loan._id} style={{ borderBottom: '1px solid #1e1e2e' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#1c1c28')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 700, color: '#f0f0f8' }}>{formatCurrency(loan.amount)}</td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: '#8b8ba7' }}>{loan.tenure} days</td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: '#8b8ba7' }}>{formatCurrency(loan.totalRepayment)}</td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: '#8b8ba7' }}>{formatDate(loan.appliedAt)}</td>
                  <td style={{ padding: '14px 20px' }}><StatusBadge status={loan.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

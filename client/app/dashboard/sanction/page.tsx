'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Loan } from '@/types';
import { Card, Button, EmptyState, Spinner } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface BorrowerUser {
  _id: string; name: string; email: string; pan?: string;
  monthlySalary?: number; employmentMode?: string; dateOfBirth?: string;
}

type LoanWithBorrower = Omit<Loan, 'borrower'> & { borrower: BorrowerUser };

export default function SanctionPage() {
  const [loans, setLoans] = useState<LoanWithBorrower[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<LoanWithBorrower | null>(null);
  const [rejReason, setRejReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchLoans = () => {
    setLoading(true);
    api.get('/dashboard/sanction').then(r => { setLoans(r.data.loans); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchLoans(); }, []);

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!selected) return;
    if (action === 'reject' && !rejReason.trim()) return toast.error('Please provide a rejection reason');
    setActionLoading(true);
    try {
      await api.patch(`/loans/${selected._id}/sanction`, { action, rejectionReason: rejReason });
      toast.success(`Loan ${action === 'approve' ? 'sanctioned ✅' : 'rejected ❌'}`);
      setSelected(null);
      setRejReason('');
      fetchLoans();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f0f0f8', marginBottom: 4 }}>✅ Sanction — Loan Review</h1>
        <p style={{ color: '#5a5a72', fontSize: 13 }}>Review and approve or reject applied loan applications.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 20 }}>
        {/* Loans list */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spinner size={28} /></div>
          ) : loans.length === 0 ? (
            <EmptyState icon="✅" title="No pending applications" message="All caught up!" />
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2a2a3a' }}>
                  {['Borrower', 'Amount', 'Tenure', 'Applied On', 'Action'].map(h => (
                    <th key={h} style={{ padding: '12px 18px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#5a5a72', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loans.map(loan => (
                  <tr key={loan._id} style={{ borderBottom: '1px solid #1e1e2e', background: selected?._id === loan._id ? '#1c1c28' : 'transparent' }}
                    onMouseEnter={e => { if (selected?._id !== loan._id) e.currentTarget.style.background = '#191926'; }}
                    onMouseLeave={e => { if (selected?._id !== loan._id) e.currentTarget.style.background = 'transparent'; }}>
                    <td style={{ padding: '13px 18px' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f8' }}>{(loan.borrower as BorrowerUser).name}</p>
                      <p style={{ fontSize: 11, color: '#5a5a72' }}>{(loan.borrower as BorrowerUser).email}</p>
                    </td>
                    <td style={{ padding: '13px 18px', fontSize: 13, fontWeight: 700, color: '#f0f0f8' }}>{formatCurrency(loan.amount)}</td>
                    <td style={{ padding: '13px 18px', fontSize: 13, color: '#8b8ba7' }}>{loan.tenure}d</td>
                    <td style={{ padding: '13px 18px', fontSize: 13, color: '#8b8ba7' }}>{formatDate(loan.appliedAt)}</td>
                    <td style={{ padding: '13px 18px' }}>
                      <button onClick={() => { setSelected(loan); setRejReason(''); }}
                        style={{ background: 'rgba(79,110,247,0.1)', border: '1px solid rgba(79,110,247,0.3)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', color: '#4f6ef7', fontSize: 12, fontWeight: 600 }}>
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        {/* Review panel */}
        {selected && (
          <div>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f0f0f8' }}>Application Review</h3>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#5a5a72', cursor: 'pointer', fontSize: 18 }}>×</button>
              </div>

              {/* Borrower info */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#5a5a72', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Borrower</p>
                {[
                  ['Name', (selected.borrower as BorrowerUser).name],
                  ['Email', (selected.borrower as BorrowerUser).email],
                  ['PAN', (selected.borrower as BorrowerUser).pan || '—'],
                  ['Monthly Salary', formatCurrency((selected.borrower as BorrowerUser).monthlySalary || 0)],
                  ['Employment', (selected.borrower as BorrowerUser).employmentMode || '—'],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1e1e2e' }}>
                    <span style={{ fontSize: 12, color: '#5a5a72' }}>{l}</span>
                    <span style={{ fontSize: 12, color: '#f0f0f8', fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>

              {/* Loan info */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#5a5a72', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Loan Details</p>
                {[
                  ['Amount', formatCurrency(selected.amount)],
                  ['Tenure', `${selected.tenure} days`],
                  ['Interest', `${selected.interestRate}% p.a.`],
                  ['SI', formatCurrency(selected.simpleInterest)],
                  ['Total Repayment', formatCurrency(selected.totalRepayment)],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1e1e2e' }}>
                    <span style={{ fontSize: 12, color: '#5a5a72' }}>{l}</span>
                    <span style={{ fontSize: 12, color: '#f0f0f8', fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>

              {/* Salary slip */}
              {selected.salarySlipUrl && (
                <a href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${selected.salarySlipUrl}`} target="_blank" rel="noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(79,110,247,0.08)', border: '1px solid rgba(79,110,247,0.2)', borderRadius: 8, marginBottom: 20, textDecoration: 'none' }}>
                  <span style={{ fontSize: 18 }}>📄</span>
                  <span style={{ fontSize: 12, color: '#4f6ef7', fontWeight: 500 }}>{selected.salarySlipOriginalName || 'View Salary Slip'}</span>
                </a>
              )}

              {/* Rejection reason */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: '#8b8ba7', fontWeight: 500, display: 'block', marginBottom: 6 }}>Rejection Reason (if rejecting)</label>
                <textarea value={rejReason} onChange={e => setRejReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  style={{ width: '100%', background: '#111118', border: '1px solid #2a2a3a', borderRadius: 8, padding: '8px 12px', color: '#f0f0f8', fontSize: 13, resize: 'vertical', minHeight: 70, outline: 'none' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Button variant="success" loading={actionLoading} onClick={() => handleAction('approve')}>Approve ✅</Button>
                <Button variant="danger" loading={actionLoading} onClick={() => handleAction('reject')}>Reject ❌</Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

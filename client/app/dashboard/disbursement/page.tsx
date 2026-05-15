'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Loan } from '@/types';
import { Card, Button, EmptyState, Spinner } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface BorrowerUser { _id: string; name: string; email: string; pan?: string; }
type LoanWithBorrower = Omit<Loan, 'borrower'> & { borrower: BorrowerUser };

export default function DisbursementPage() {
  const [loans, setLoans] = useState<LoanWithBorrower[]>([]);
  const [loading, setLoading] = useState(true);
  const [disbursing, setDisbursing] = useState<string | null>(null);

  const fetchLoans = () => {
    setLoading(true);
    api.get('/dashboard/disbursement').then(r => { setLoans(r.data.loans); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchLoans(); }, []);

  const handleDisburse = async (loanId: string, borrowerName: string) => {
    if (!confirm(`Confirm disbursement for ${borrowerName}?`)) return;
    setDisbursing(loanId);
    try {
      await api.patch(`/loans/${loanId}/disburse`, {});
      toast.success('Loan disbursed successfully! 💸');
      fetchLoans();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Disbursement failed');
    } finally {
      setDisbursing(null);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f0f0f8', marginBottom: 4 }}>💸 Disbursement</h1>
        <p style={{ color: '#5a5a72', fontSize: 13 }}>Sanctioned loans pending funds release.</p>
      </div>

      <Card style={{ marginBottom: 16, padding: '12px 20px', background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.2)' }}>
        <p style={{ color: '#f59e0b', fontSize: 13 }}>⚠️ Disbursing a loan marks it as active and starts the repayment cycle. This action cannot be undone.</p>
      </Card>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spinner size={28} /></div>
        ) : loans.length === 0 ? (
          <EmptyState icon="💸" title="No loans pending disbursement" message="All sanctioned loans have been disbursed." />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2a2a3a' }}>
                {['Borrower', 'PAN', 'Amount', 'Tenure', 'Total Repayment', 'Sanctioned On', 'Action'].map(h => (
                  <th key={h} style={{ padding: '12px 18px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#5a5a72', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loans.map(loan => (
                <tr key={loan._id} style={{ borderBottom: '1px solid #1e1e2e' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#1c1c28')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '13px 18px' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f8' }}>{(loan.borrower as BorrowerUser).name}</p>
                    <p style={{ fontSize: 11, color: '#5a5a72' }}>{(loan.borrower as BorrowerUser).email}</p>
                  </td>
                  <td style={{ padding: '13px 18px', fontSize: 12, color: '#8b8ba7', fontFamily: 'monospace' }}>{(loan.borrower as BorrowerUser).pan || '—'}</td>
                  <td style={{ padding: '13px 18px', fontSize: 13, fontWeight: 700, color: '#f0f0f8' }}>{formatCurrency(loan.amount)}</td>
                  <td style={{ padding: '13px 18px', fontSize: 13, color: '#8b8ba7' }}>{loan.tenure}d</td>
                  <td style={{ padding: '13px 18px', fontSize: 13, color: '#4f6ef7', fontWeight: 600 }}>{formatCurrency(loan.totalRepayment)}</td>
                  <td style={{ padding: '13px 18px', fontSize: 13, color: '#8b8ba7' }}>{loan.sanctionedAt ? formatDate(loan.sanctionedAt) : '—'}</td>
                  <td style={{ padding: '13px 18px' }}>
                    <Button variant="primary" loading={disbursing === loan._id}
                      onClick={() => handleDisburse(loan._id, (loan.borrower as BorrowerUser).name)}
                      style={{ fontSize: 12, padding: '6px 14px' }}>
                      Disburse 💸
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

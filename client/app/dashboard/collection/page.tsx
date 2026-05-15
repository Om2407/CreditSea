'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Loan, Payment } from '@/types';
import { Card, Button, StatusBadge, EmptyState, Spinner } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface BorrowerUser { _id: string; name: string; email: string; pan?: string; }
type LoanWithData = Omit<Loan, 'borrower'> & { borrower: BorrowerUser; payments: Payment[] };

export default function CollectionPage() {
  const [loans, setLoans] = useState<LoanWithData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<LoanWithData | null>(null);
  const [payForm, setPayForm] = useState({ utrNumber: '', amount: '', paymentDate: new Date().toISOString().split('T')[0] });
  const [payLoading, setPayLoading] = useState(false);

  const fetchLoans = () => {
    setLoading(true);
    api.get('/dashboard/collection').then(r => { setLoans(r.data.loans); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchLoans(); }, []);

  const handlePayment = async () => {
    if (!selected) return;
    if (!payForm.utrNumber.trim()) return toast.error('UTR number is required');
    if (!payForm.amount || Number(payForm.amount) <= 0) return toast.error('Valid amount required');
    if (!payForm.paymentDate) return toast.error('Payment date is required');

    setPayLoading(true);
    try {
      const res = await api.post('/payments', {
        loanId: selected._id,
        utrNumber: payForm.utrNumber.trim(),
        amount: Number(payForm.amount),
        paymentDate: payForm.paymentDate,
      });
      toast.success(res.data.message);
      setPayForm({ utrNumber: '', amount: '', paymentDate: new Date().toISOString().split('T')[0] });
      fetchLoans();
      // Update selected with fresh data
      const updated = (await api.get('/dashboard/collection')).data.loans.find((l: LoanWithData) => l._id === selected._id);
      setSelected(updated || null);
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Payment failed');
    } finally {
      setPayLoading(false);
    }
  };

  const disbursed = loans.filter(l => l.status === 'disbursed');
  const closed = loans.filter(l => l.status === 'closed');

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f0f0f8', marginBottom: 4 }}>💰 Collection</h1>
        <p style={{ color: '#5a5a72', fontSize: 13 }}>Record repayments for active loans.</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Active Loans', value: disbursed.length, color: '#c084fc' },
          { label: 'Closed Loans', value: closed.length, color: '#4ade80' },
          { label: 'Total Loans', value: loans.length, color: '#60a5fa' },
        ].map(s => (
          <Card key={s.label} style={{ padding: '14px 18px' }}>
            <p style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</p>
            <p style={{ fontSize: 11, color: '#5a5a72', fontWeight: 600, marginTop: 2 }}>{s.label}</p>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap: 20 }}>
        {/* Loans table */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spinner size={28} /></div>
          ) : loans.length === 0 ? (
            <EmptyState icon="💰" title="No active loans" message="Disbursed loans will appear here." />
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2a2a3a' }}>
                  {['Borrower', 'Amount', 'Paid', 'Outstanding', 'Status', 'Action'].map(h => (
                    <th key={h} style={{ padding: '12px 18px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#5a5a72', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loans.map(loan => {
                  const pct = loan.totalRepayment > 0 ? (loan.totalPaid / loan.totalRepayment) * 100 : 0;
                  return (
                    <tr key={loan._id} style={{ borderBottom: '1px solid #1e1e2e', background: selected?._id === loan._id ? '#1c1c28' : 'transparent' }}
                      onMouseEnter={e => { if (selected?._id !== loan._id) e.currentTarget.style.background = '#191926'; }}
                      onMouseLeave={e => { if (selected?._id !== loan._id) e.currentTarget.style.background = 'transparent'; }}>
                      <td style={{ padding: '13px 18px' }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f8' }}>{(loan.borrower as BorrowerUser).name}</p>
                        <p style={{ fontSize: 11, color: '#5a5a72' }}>{(loan.borrower as BorrowerUser).email}</p>
                      </td>
                      <td style={{ padding: '13px 18px', fontSize: 13, fontWeight: 700, color: '#f0f0f8' }}>{formatCurrency(loan.totalRepayment)}</td>
                      <td style={{ padding: '13px 18px' }}>
                        <p style={{ fontSize: 13, color: '#4ade80', fontWeight: 600 }}>{formatCurrency(loan.totalPaid)}</p>
                        <div style={{ width: 60, height: 3, background: '#1e1e2e', borderRadius: 2, marginTop: 4 }}>
                          <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: '#4ade80', borderRadius: 2, transition: 'width 0.3s' }} />
                        </div>
                      </td>
                      <td style={{ padding: '13px 18px', fontSize: 13, color: '#f59e0b', fontWeight: 600 }}>{formatCurrency(loan.outstandingBalance)}</td>
                      <td style={{ padding: '13px 18px' }}><StatusBadge status={loan.status} /></td>
                      <td style={{ padding: '13px 18px' }}>
                        {loan.status === 'disbursed' ? (
                          <button onClick={() => { setSelected(loan); setPayForm(p => ({ ...p, amount: '' })); }}
                            style={{ background: 'rgba(79,110,247,0.1)', border: '1px solid rgba(79,110,247,0.3)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', color: '#4f6ef7', fontSize: 12, fontWeight: 600 }}>
                            Add Payment
                          </button>
                        ) : (
                          <button onClick={() => setSelected(loan)}
                            style={{ background: 'transparent', border: '1px solid #2a2a3a', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', color: '#5a5a72', fontSize: 12 }}>
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>

        {/* Payment panel */}
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Summary */}
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#f0f0f8' }}>{(selected.borrower as BorrowerUser).name}</p>
                  <p style={{ fontSize: 12, color: '#5a5a72' }}>{(selected.borrower as BorrowerUser).email}</p>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#5a5a72', cursor: 'pointer', fontSize: 18 }}>×</button>
              </div>

              {/* Progress bar */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#5a5a72', marginBottom: 6 }}>
                  <span>Repayment Progress</span>
                  <span>{Math.round((selected.totalPaid / selected.totalRepayment) * 100)}%</span>
                </div>
                <div style={{ height: 6, background: '#1e1e2e', borderRadius: 3 }}>
                  <div style={{ width: `${Math.min((selected.totalPaid / selected.totalRepayment) * 100, 100)}%`, height: '100%', background: 'linear-gradient(90deg,#4f6ef7,#22c55e)', borderRadius: 3, transition: 'width 0.3s' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { l: 'Total', v: formatCurrency(selected.totalRepayment), c: '#f0f0f8' },
                  { l: 'Paid', v: formatCurrency(selected.totalPaid), c: '#4ade80' },
                  { l: 'Outstanding', v: formatCurrency(selected.outstandingBalance), c: '#f59e0b' },
                  { l: 'Disbursed', v: selected.disbursedAt ? formatDate(selected.disbursedAt) : '—', c: '#8b8ba7' },
                ].map(item => (
                  <div key={item.l} style={{ background: '#111118', borderRadius: 8, padding: '10px 12px' }}>
                    <p style={{ fontSize: 10, color: '#5a5a72', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{item.l}</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: item.c }}>{item.v}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Record payment form */}
            {selected.status === 'disbursed' && (
              <Card>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#f0f0f8', marginBottom: 16 }}>Record Payment</p>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, color: '#8b8ba7', fontWeight: 500, display: 'block', marginBottom: 6 }}>UTR Number *</label>
                  <input value={payForm.utrNumber} onChange={e => setPayForm(p => ({ ...p, utrNumber: e.target.value }))}
                    placeholder="e.g. UTR123456789"
                    style={{ width: '100%', background: '#111118', border: '1px solid #2a2a3a', borderRadius: 8, padding: '8px 12px', color: '#f0f0f8', fontSize: 13, outline: 'none' }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, color: '#8b8ba7', fontWeight: 500, display: 'block', marginBottom: 6 }}>
                    Amount (₹) * — Outstanding: {formatCurrency(selected.outstandingBalance)}
                  </label>
                  <input type="number" value={payForm.amount} onChange={e => setPayForm(p => ({ ...p, amount: e.target.value }))}
                    placeholder="e.g. 10000"
                    max={selected.outstandingBalance}
                    style={{ width: '100%', background: '#111118', border: '1px solid #2a2a3a', borderRadius: 8, padding: '8px 12px', color: '#f0f0f8', fontSize: 13, outline: 'none' }} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, color: '#8b8ba7', fontWeight: 500, display: 'block', marginBottom: 6 }}>Payment Date *</label>
                  <input type="date" value={payForm.paymentDate} onChange={e => setPayForm(p => ({ ...p, paymentDate: e.target.value }))}
                    style={{ width: '100%', background: '#111118', border: '1px solid #2a2a3a', borderRadius: 8, padding: '8px 12px', color: '#f0f0f8', fontSize: 13, outline: 'none' }} />
                </div>
                <Button fullWidth loading={payLoading} onClick={handlePayment}>Record Payment</Button>
              </Card>
            )}

            {/* Payment history */}
            {selected.payments?.length > 0 && (
              <Card>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#f0f0f8', marginBottom: 14 }}>Payment History ({selected.payments.length})</p>
                {selected.payments.map((p, i) => (
                  <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < selected.payments.length - 1 ? '1px solid #1e1e2e' : 'none' }}>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#f0f0f8' }}>{formatCurrency(p.amount)}</p>
                      <p style={{ fontSize: 11, color: '#5a5a72', fontFamily: 'monospace' }}>{p.utrNumber}</p>
                    </div>
                    <p style={{ fontSize: 11, color: '#5a5a72' }}>{formatDate(p.paymentDate)}</p>
                  </div>
                ))}
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

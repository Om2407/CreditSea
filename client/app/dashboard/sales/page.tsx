'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, StatusBadge, EmptyState, Spinner } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { LoanStatus } from '@/types';

interface Lead {
  _id: string;
  name: string;
  email: string;
  breStatus: string;
  personalDetailsSubmitted: boolean;
  hasApplied: boolean;
  loanStatus: LoanStatus | null;
  createdAt: string;
}

export default function SalesPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'not_applied' | 'applied'>('all');

  useEffect(() => {
    api.get('/dashboard/sales').then(r => { setLeads(r.data.leads); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = leads.filter(l => {
    if (filter === 'not_applied') return !l.hasApplied;
    if (filter === 'applied') return l.hasApplied;
    return true;
  });

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f0f0f8', marginBottom: 4 }}>🎯 Sales — Lead Tracker</h1>
        <p style={{ color: '#5a5a72', fontSize: 13 }}>All registered borrowers and their application status.</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Leads', value: leads.length, color: '#60a5fa' },
          { label: 'Not Applied', value: leads.filter(l => !l.hasApplied).length, color: '#f59e0b' },
          { label: 'Applied', value: leads.filter(l => l.hasApplied).length, color: '#4ade80' },
        ].map(s => (
          <Card key={s.label} style={{ padding: '14px 18px' }}>
            <p style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</p>
            <p style={{ fontSize: 11, color: '#5a5a72', fontWeight: 600, marginTop: 2 }}>{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['all', 'not_applied', 'applied'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: filter === f ? '#4f6ef7' : '#16161f',
              color: filter === f ? 'white' : '#8b8ba7',
              border: `1px solid ${filter === f ? '#4f6ef7' : '#2a2a3a'}`,
            }}>
            {f === 'all' ? 'All' : f === 'not_applied' ? 'Not Applied' : 'Applied'}
          </button>
        ))}
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spinner size={28} /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="🎯" title="No leads found" />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2a2a3a' }}>
                {['Name', 'Email', 'Registered', 'BRE Status', 'Application Status'].map(h => (
                  <th key={h} style={{ padding: '12px 18px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#5a5a72', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(lead => (
                <tr key={lead._id} style={{ borderBottom: '1px solid #1e1e2e' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#1c1c28')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '13px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#4f6ef7,#7c3aed)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                        {lead.name[0].toUpperCase()}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f8' }}>{lead.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '13px 18px', fontSize: 13, color: '#8b8ba7' }}>{lead.email}</td>
                  <td style={{ padding: '13px 18px', fontSize: 13, color: '#8b8ba7' }}>{formatDate(lead.createdAt)}</td>
                  <td style={{ padding: '13px 18px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                      color: lead.breStatus === 'passed' ? '#4ade80' : lead.breStatus === 'rejected' ? '#f87171' : '#f59e0b',
                    }}>
                      {lead.breStatus === 'pending' && !lead.personalDetailsSubmitted ? '—' : lead.breStatus}
                    </span>
                  </td>
                  <td style={{ padding: '13px 18px' }}>
                    {lead.loanStatus ? <StatusBadge status={lead.loanStatus} /> : (
                      <span style={{ fontSize: 12, color: '#5a5a72', fontStyle: 'italic' }}>Not applied</span>
                    )}
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

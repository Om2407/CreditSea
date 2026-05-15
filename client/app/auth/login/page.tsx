'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Button, InputField } from '@/components/ui';

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill all fields');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.token, data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
      // Hard redirect — avoids Next.js router race condition with localStorage
      setTimeout(() => {
        if (data.user.role === 'borrower') {
          window.location.href = '/borrower/dashboard';
        } else {
          window.location.href = '/dashboard';
        }
      }, 800);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed';
      toast.error(msg);
      setLoading(false);
    }
  };

  const fillDemo = (email: string, password: string) => setForm({ email, password });

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#4f6ef7,#7c3aed)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>💳</div>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#f0f0f8', letterSpacing: '-0.5px' }}>LoanFlow</span>
          </div>
          <p style={{ color: '#5a5a72', fontSize: 14 }}>Sign in to your account</p>
        </div>

        <div style={{ background: '#16161f', border: '1px solid #2a2a3a', borderRadius: 16, padding: 32 }}>
          <form onSubmit={handleSubmit}>
            <InputField
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              autoComplete="email"
            />
            <InputField
              label="Password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              autoComplete="current-password"
            />
            <Button type="submit" fullWidth loading={loading} style={{ marginTop: 8 }}>
              Sign In
            </Button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#5a5a72' }}>
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" style={{ color: '#4f6ef7', fontWeight: 600, textDecoration: 'none' }}>Sign Up</Link>
          </p>
        </div>

        <div style={{ marginTop: 24, background: '#16161f', border: '1px solid #2a2a3a', borderRadius: 12, padding: 20 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#5a5a72', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Demo Accounts</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { role: 'Admin', email: 'admin@lms.com', pass: 'admin123' },
              { role: 'Borrower', email: 'borrower@lms.com', pass: 'borrower123' },
              { role: 'Sales', email: 'sales@lms.com', pass: 'sales123' },
              { role: 'Sanction', email: 'sanction@lms.com', pass: 'sanction123' },
              { role: 'Disburse', email: 'disburse@lms.com', pass: 'disburse123' },
              { role: 'Collection', email: 'collection@lms.com', pass: 'collection123' },
            ].map(d => (
              <button key={d.role} onClick={() => fillDemo(d.email, d.pass)}
                style={{ background: '#111118', border: '1px solid #2a2a3a', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#4f6ef7')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2a3a')}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: '#4f6ef7' }}>{d.role}</div>
                <div style={{ fontSize: 11, color: '#5a5a72', marginTop: 2 }}>{d.email}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

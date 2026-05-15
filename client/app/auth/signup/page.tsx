'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Button, InputField } from '@/components/ui';

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('All fields are required');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');

    setLoading(true);
    try {
      const { data } = await api.post('/auth/signup', {
        name: form.name, email: form.email, password: form.password,
      });
      login(data.token, data.user);
      toast.success('Account created! Welcome aboard 🎉');
      router.replace('/borrower/apply');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Signup failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#4f6ef7,#7c3aed)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>💳</div>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#f0f0f8', letterSpacing: '-0.5px' }}>LoanFlow</span>
          </div>
          <p style={{ color: '#5a5a72', fontSize: 14 }}>Create your borrower account</p>
        </div>

        <div style={{ background: '#16161f', border: '1px solid #2a2a3a', borderRadius: 16, padding: 32 }}>
          <form onSubmit={handleSubmit}>
            <InputField label="Full Name" type="text" placeholder="Rahul Sharma" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            <InputField label="Email Address" type="email" placeholder="rahul@example.com" value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            <InputField label="Password" type="password" placeholder="Min 6 characters" value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
            <InputField label="Confirm Password" type="password" placeholder="Re-enter password" value={form.confirmPassword}
              onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))} />
            <Button type="submit" fullWidth loading={loading} style={{ marginTop: 8 }}>
              Create Account
            </Button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#5a5a72' }}>
            Already have an account?{' '}
            <Link href="/auth/login" style={{ color: '#4f6ef7', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

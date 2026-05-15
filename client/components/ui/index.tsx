'use client';

import React from 'react';
import { LoanStatus } from '@/types';

// ── Spinner ──────────────────────────────────────────────────────────────────
export const Spinner = ({ size = 20 }: { size?: number }) => (
  <>
    <div style={{
      width: size, height: size,
      border: `2px solid #4f6ef7`,
      borderTopColor: 'transparent',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
      display: 'inline-block',
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </>
);

// ── Status Badge ─────────────────────────────────────────────────────────────
const statusConfig: Record<LoanStatus, { label: string; bg: string; color: string; border: string }> = {
  applied:    { label: 'Applied',    bg: 'rgba(30,58,95,0.3)',  color: '#60a5fa', border: '#1e3a5f' },
  sanctioned: { label: 'Sanctioned', bg: 'rgba(26,58,42,0.3)', color: '#4ade80', border: '#1a3a2a' },
  disbursed:  { label: 'Disbursed',  bg: 'rgba(42,26,58,0.3)', color: '#c084fc', border: '#2a1a3a' },
  closed:     { label: 'Closed',     bg: 'rgba(26,42,26,0.3)', color: '#86efac', border: '#1a2a1a' },
  rejected:   { label: 'Rejected',   bg: 'rgba(58,26,26,0.3)', color: '#f87171', border: '#3a1a1a' },
};

export const StatusBadge = ({ status }: { status: LoanStatus }) => {
  const cfg = statusConfig[status] || statusConfig.applied;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 999,
      fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color, display: 'inline-block' }} />
      {cfg.label}
    </span>
  );
};

// ── Input Field ──────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const InputField = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, ...props }, ref) => (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#8b8ba7', marginBottom: 6 }}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        {...props}
        style={{
          width: '100%',
          background: '#111118',
          border: `1px solid ${error ? '#ef4444' : '#2a2a3a'}`,
          borderRadius: 8,
          padding: '10px 14px',
          fontSize: 14,
          color: '#f0f0f8',
          outline: 'none',
          transition: 'border-color 0.2s',
          ...props.style,
        }}
        onFocus={e => { e.target.style.borderColor = '#4f6ef7'; e.target.style.boxShadow = '0 0 0 3px rgba(79,110,247,0.12)'; }}
        onBlur={e => { e.target.style.borderColor = error ? '#ef4444' : '#2a2a3a'; e.target.style.boxShadow = 'none'; }}
      />
      {error && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{error}</p>}
    </div>
  )
);
InputField.displayName = 'InputField';

// ── Select Field ─────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const SelectField = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, ...props }, ref) => (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#8b8ba7', marginBottom: 6 }}>
          {label}
        </label>
      )}
      <select
        ref={ref}
        {...props}
        style={{
          width: '100%',
          background: '#111118',
          border: `1px solid ${error ? '#ef4444' : '#2a2a3a'}`,
          borderRadius: 8,
          padding: '10px 14px',
          fontSize: 14,
          color: '#f0f0f8',
          outline: 'none',
          cursor: 'pointer',
          ...props.style,
        }}
      >
        <option value="">Select...</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{error}</p>}
    </div>
  )
);
SelectField.displayName = 'SelectField';

// ── Button ───────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = ({ variant = 'primary', loading, fullWidth, children, disabled, ...props }: ButtonProps) => {
  const styles: Record<string, React.CSSProperties> = {
    primary:   { background: '#4f6ef7', color: 'white', border: 'none' },
    secondary: { background: 'transparent', color: '#8b8ba7', border: '1px solid #2a2a3a' },
    danger:    { background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' },
    success:   { background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' },
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      style={{
        ...styles[variant],
        padding: '10px 20px',
        borderRadius: 8,
        fontWeight: 600,
        fontSize: 14,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.6 : 1,
        transition: 'all 0.2s',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        width: fullWidth ? '100%' : 'auto',
        ...props.style,
      }}
    >
      {loading && <Spinner size={16} />}
      {children}
    </button>
  );
};

// ── Card ─────────────────────────────────────────────────────────────────────
export const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{
    background: '#16161f',
    border: '1px solid #2a2a3a',
    borderRadius: 12,
    padding: 24,
    ...style,
  }}>
    {children}
  </div>
);

// ── Empty State ───────────────────────────────────────────────────────────────
export const EmptyState = ({ icon, title, message }: { icon?: string; title: string; message?: string }) => (
  <div style={{ textAlign: 'center', padding: '48px 24px', color: '#5a5a72' }}>
    {icon && <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>}
    <p style={{ fontSize: 15, fontWeight: 600, color: '#8b8ba7', marginBottom: 4 }}>{title}</p>
    {message && <p style={{ fontSize: 13 }}>{message}</p>}
  </div>
);

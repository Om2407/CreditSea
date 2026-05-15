'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Button, InputField, SelectField, Card } from '@/components/ui';
import { calculateLoan, formatCurrency, getAge, validatePAN } from '@/lib/utils';

type Step = 1 | 2 | 3 | 4;

const STEPS = [
  { n: 1, label: 'Personal Details' },
  { n: 2, label: 'Eligibility Check' },
  { n: 3, label: 'Salary Slip' },
  { n: 4, label: 'Loan Config' },
];

export default function ApplyPage() {
  const router = useRouter();
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  // Determine starting step based on user's breStatus
  const getInitialStep = (): Step => {
    if (!user) return 1;
    if (user.breStatus === 'passed') return 3;
    return 1;
  };

  const [step, setStep] = useState<Step>(getInitialStep);
  const [loading, setLoading] = useState(false);

  // Step 1 form
  const [personalForm, setPersonalForm] = useState({
    pan: '',
    dateOfBirth: '',
    monthlySalary: '',
    employmentMode: '' as '' | 'salaried' | 'self-employed' | 'unemployed',
  });

  // Step 3
  const [salaryFile, setSalaryFile] = useState<File | null>(null);
  const [salarySlipUrl, setSalarySlipUrl] = useState('');
  const [salarySlipOriginalName, setSalarySlipOriginalName] = useState('');

  // Step 4
  const [amount, setAmount] = useState(150000);
  const [tenure, setTenure] = useState(180);
  const { simpleInterest, totalRepayment } = calculateLoan(amount, tenure);

  // Client-side BRE preview hints
  const clientBREHints = () => {
    const hints: string[] = [];
    if (personalForm.dateOfBirth) {
      const age = getAge(personalForm.dateOfBirth);
      if (age < 23 || age > 50) hints.push(`Age ${age} is outside 23–50 range`);
    }
    if (personalForm.monthlySalary && Number(personalForm.monthlySalary) < 25000)
      hints.push('Salary below ₹25,000 minimum');
    if (personalForm.pan && !validatePAN(personalForm.pan))
      hints.push('PAN format invalid (e.g. ABCDE1234F)');
    if (personalForm.employmentMode === 'unemployed')
      hints.push('Unemployed applicants are not eligible');
    return hints;
  };

  useEffect(() => {
    if (user?.breStatus === 'passed' && step < 3) setStep(3);
  }, [user, step]);

  // ── Step 1: Submit personal details ──────────────────────────────────────
  const handlePersonalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personalForm.pan || !personalForm.dateOfBirth || !personalForm.monthlySalary || !personalForm.employmentMode)
      return toast.error('All fields are required');

    setLoading(true);
    try {
      await api.post('/loans/personal-details', {
        pan: personalForm.pan.toUpperCase(),
        dateOfBirth: personalForm.dateOfBirth,
        monthlySalary: Number(personalForm.monthlySalary),
        employmentMode: personalForm.employmentMode,
      });
      toast.success('Eligibility check passed! ✅');
      setStep(2);
      setTimeout(() => setStep(3), 1800);
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: { message?: string; breRejected?: boolean } } };
      if (e2.response?.data?.breRejected) {
        toast.error(e2.response.data.message || 'Eligibility check failed');
        setStep(2);
      } else {
        toast.error(e2.response?.data?.message || 'Server error');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Upload salary slip ────────────────────────────────────────────
  const handleFileUpload = async () => {
    if (!salaryFile) return toast.error('Please select a file');
    const formData = new FormData();
    formData.append('salarySlip', salaryFile);
    setLoading(true);
    try {
      const { data } = await api.post('/loans/upload-salary-slip', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSalarySlipUrl(data.fileUrl);
      setSalarySlipOriginalName(data.originalName);
      toast.success('Salary slip uploaded!');
      setStep(4);
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 4: Apply loan ────────────────────────────────────────────────────
  const handleApply = async () => {
    setLoading(true);
    try {
      await api.post('/loans/apply', { amount, tenure, salarySlipUrl, salarySlipOriginalName });
      toast.success('🎉 Loan application submitted!');
      router.push('/borrower/dashboard');
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Application failed');
    } finally {
      setLoading(false);
    }
  };

  const breHints = clientBREHints();

  return (
    <div style={{ maxWidth: 620, margin: '0 auto', paddingTop: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f0f0f8', marginBottom: 6 }}>Apply for a Loan</h1>
      <p style={{ color: '#5a5a72', fontSize: 14, marginBottom: 32 }}>Complete the steps below to submit your application.</p>

      {/* Stepper */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 36, position: 'relative' }}>
        {STEPS.map((s, i) => {
          const done = step > s.n || (step === 2 && s.n === 1);
          const active = step === s.n;
          return (
            <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700,
                  background: done ? '#22c55e' : active ? '#4f6ef7' : '#111118',
                  color: done || active ? 'white' : '#5a5a72',
                  border: done ? '2px solid #22c55e' : active ? '2px solid #4f6ef7' : '2px solid #2a2a3a',
                  transition: 'all 0.3s',
                }}>
                  {done ? '✓' : s.n}
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, color: active ? '#4f6ef7' : done ? '#22c55e' : '#5a5a72', whiteSpace: 'nowrap' }}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 2, background: step > s.n ? '#22c55e' : '#2a2a3a', margin: '0 8px', marginBottom: 20, transition: 'background 0.3s' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── STEP 1: Personal Details ── */}
      {step === 1 && (
        <Card>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#f0f0f8', marginBottom: 4 }}>Personal Details</h2>
          <p style={{ color: '#5a5a72', fontSize: 13, marginBottom: 24 }}>We&apos;ll run an eligibility check based on these details.</p>

          {/* Live BRE hints */}
          {breHints.length > 0 && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
              {breHints.map((h, i) => <p key={i} style={{ color: '#f87171', fontSize: 12, marginBottom: i < breHints.length - 1 ? 4 : 0 }}>⚠ {h}</p>)}
            </div>
          )}

          <form onSubmit={handlePersonalSubmit}>
            <InputField label="PAN Number" placeholder="ABCDE1234F" value={personalForm.pan}
              onChange={e => setPersonalForm(p => ({ ...p, pan: e.target.value.toUpperCase() }))} maxLength={10} />
            <InputField label="Date of Birth" type="date" value={personalForm.dateOfBirth}
              onChange={e => setPersonalForm(p => ({ ...p, dateOfBirth: e.target.value }))} />
            <InputField label="Monthly Salary (₹)" type="number" placeholder="e.g. 50000" value={personalForm.monthlySalary}
              onChange={e => setPersonalForm(p => ({ ...p, monthlySalary: e.target.value }))} />
            <SelectField label="Employment Mode" value={personalForm.employmentMode}
              onChange={e => setPersonalForm(p => ({ ...p, employmentMode: e.target.value as typeof personalForm.employmentMode }))}
              options={[
                { value: 'salaried', label: 'Salaried' },
                { value: 'self-employed', label: 'Self Employed' },
                { value: 'unemployed', label: 'Unemployed' },
              ]}
            />
            <Button type="submit" fullWidth loading={loading}>Check Eligibility →</Button>
          </form>
        </Card>
      )}

      {/* ── STEP 2: BRE Result ── */}
      {step === 2 && (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#22c55e', marginBottom: 8 }}>Eligibility Check Passed!</h2>
          <p style={{ color: '#8b8ba7', fontSize: 14 }}>Redirecting to upload your salary slip...</p>
        </Card>
      )}

      {/* ── STEP 3: Upload Salary Slip ── */}
      {step === 3 && (
        <Card>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#f0f0f8', marginBottom: 4 }}>Upload Salary Slip</h2>
          <p style={{ color: '#5a5a72', fontSize: 13, marginBottom: 24 }}>PDF, JPG, or PNG — max 5 MB.</p>

          <div
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${salaryFile ? '#22c55e' : '#2a2a3a'}`,
              borderRadius: 12, padding: 40, textAlign: 'center', cursor: 'pointer',
              transition: 'border-color 0.2s, background 0.2s',
              background: salaryFile ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.01)',
              marginBottom: 20,
            }}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setSalaryFile(f); }}
          >
            <div style={{ fontSize: 32, marginBottom: 10 }}>{salaryFile ? '📄' : '☁️'}</div>
            <p style={{ color: salaryFile ? '#22c55e' : '#8b8ba7', fontWeight: 600, fontSize: 14 }}>
              {salaryFile ? salaryFile.name : 'Click or drag & drop your file here'}
            </p>
            {!salaryFile && <p style={{ color: '#5a5a72', fontSize: 12, marginTop: 4 }}>PDF, JPG, PNG up to 5MB</p>}
          </div>

          <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }}
            onChange={e => e.target.files?.[0] && setSalaryFile(e.target.files[0])} />

          <Button fullWidth loading={loading} onClick={handleFileUpload} disabled={!salaryFile}>
            Upload & Continue →
          </Button>
        </Card>
      )}

      {/* ── STEP 4: Loan Config ── */}
      {step === 4 && (
        <Card>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#f0f0f8', marginBottom: 4 }}>Configure Your Loan</h2>
          <p style={{ color: '#5a5a72', fontSize: 13, marginBottom: 28 }}>Adjust the sliders to configure your loan terms.</p>

          {/* Amount Slider */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <label style={{ color: '#8b8ba7', fontSize: 13, fontWeight: 500 }}>Loan Amount</label>
              <span style={{ color: '#4f6ef7', fontSize: 15, fontWeight: 700 }}>{formatCurrency(amount)}</span>
            </div>
            <input type="range" min={50000} max={500000} step={5000} value={amount}
              onChange={e => setAmount(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#4f6ef7' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#5a5a72', marginTop: 4 }}>
              <span>₹50,000</span><span>₹5,00,000</span>
            </div>
          </div>

          {/* Tenure Slider */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <label style={{ color: '#8b8ba7', fontSize: 13, fontWeight: 500 }}>Loan Tenure</label>
              <span style={{ color: '#4f6ef7', fontSize: 15, fontWeight: 700 }}>{tenure} days</span>
            </div>
            <input type="range" min={30} max={365} step={5} value={tenure}
              onChange={e => setTenure(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#4f6ef7' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#5a5a72', marginTop: 4 }}>
              <span>30 days</span><span>365 days</span>
            </div>
          </div>

          {/* Live Calculation Panel */}
          <div style={{ background: 'linear-gradient(135deg,rgba(79,110,247,0.1),rgba(124,58,237,0.06))', border: '1px solid rgba(79,110,247,0.2)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <p style={{ color: '#8b8ba7', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>Loan Summary</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Principal', value: formatCurrency(amount) },
                { label: 'Interest Rate', value: '12% p.a.' },
                { label: 'Simple Interest', value: formatCurrency(simpleInterest) },
                { label: 'Total Repayment', value: formatCurrency(totalRepayment), highlight: true },
              ].map(item => (
                <div key={item.label} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '10px 14px' }}>
                  <p style={{ color: '#5a5a72', fontSize: 11, fontWeight: 500, marginBottom: 4 }}>{item.label}</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: item.highlight ? '#4f6ef7' : '#f0f0f8' }}>{item.value}</p>
                </div>
              ))}
            </div>
            <p style={{ color: '#5a5a72', fontSize: 11, marginTop: 12 }}>
              Formula: SI = (P × R × T) / (365 × 100) = ({formatCurrency(amount)} × 12 × {tenure}) / 36500
            </p>
          </div>

          <Button fullWidth loading={loading} onClick={handleApply}>
            Submit Application 🚀
          </Button>
        </Card>
      )}
    </div>
  );
}

// Client-side BRE preview — for UX feedback only
// Server-side BRE is the authoritative check

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export const getAge = (dob: string): number => {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

export const validatePAN = (pan: string) => PAN_REGEX.test(pan.toUpperCase());

export const calculateLoan = (principal: number, tenureDays: number, rate = 12) => {
  const si = (principal * rate * tenureDays) / (365 * 100);
  return {
    simpleInterest: Math.round(si * 100) / 100,
    totalRepayment: Math.round((principal + si) * 100) / 100,
  };
};

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

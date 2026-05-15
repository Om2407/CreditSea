// Business Rule Engine - Server-side validation
// This must live on the server to prevent client-side bypassing

export interface BREInput {
  dateOfBirth: Date;
  monthlySalary: number;
  pan: string;
  employmentMode: string;
}

export interface BREResult {
  passed: boolean;
  reason?: string;
}

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

const getAge = (dob: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
};

export const runBRE = (input: BREInput): BREResult => {
  const age = getAge(new Date(input.dateOfBirth));

  // Rule 1: Age must be between 23 and 50
  if (age < 23 || age > 50) {
    return {
      passed: false,
      reason: `Age must be between 23 and 50 years. Your age: ${age} years.`,
    };
  }

  // Rule 2: Monthly salary must be >= ₹25,000
  if (input.monthlySalary < 25000) {
    return {
      passed: false,
      reason: `Minimum monthly salary required is ₹25,000. Your salary: ₹${input.monthlySalary.toLocaleString('en-IN')}.`,
    };
  }

  // Rule 3: PAN must match valid format (AAAAA9999A)
  if (!PAN_REGEX.test(input.pan.toUpperCase())) {
    return {
      passed: false,
      reason: 'Invalid PAN format. PAN must be in format: AAAAA9999A (5 letters, 4 digits, 1 letter).',
    };
  }

  // Rule 4: Must not be unemployed
  if (input.employmentMode === 'unemployed') {
    return {
      passed: false,
      reason: 'Unemployed applicants are not eligible for a loan.',
    };
  }

  return { passed: true };
};

// Loan math utility
export const calculateLoan = (principal: number, tenureDays: number, ratePercent = 12) => {
  // SI = (P × R × T) / (365 × 100)
  const simpleInterest = (principal * ratePercent * tenureDays) / (365 * 100);
  const totalRepayment = principal + simpleInterest;
  return {
    simpleInterest: Math.round(simpleInterest * 100) / 100,
    totalRepayment: Math.round(totalRepayment * 100) / 100,
  };
};

export type UserRole = 'admin' | 'sales' | 'sanction' | 'disbursement' | 'collection' | 'borrower';

export type LoanStatus = 'applied' | 'sanctioned' | 'rejected' | 'disbursed' | 'closed';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  pan?: string;
  dateOfBirth?: string;
  monthlySalary?: number;
  employmentMode?: 'salaried' | 'self-employed' | 'unemployed';
  personalDetailsSubmitted?: boolean;
  breStatus?: 'pending' | 'passed' | 'rejected';
  breRejectionReason?: string;
  createdAt?: string;
}

export interface Loan {
  _id: string;
  borrower: User | string;
  amount: number;
  tenure: number;
  interestRate: number;
  simpleInterest: number;
  totalRepayment: number;
  salarySlipUrl?: string;
  salarySlipOriginalName?: string;
  status: LoanStatus;
  rejectionReason?: string;
  appliedAt: string;
  sanctionedAt?: string;
  disbursedAt?: string;
  closedAt?: string;
  sanctionedBy?: User | string;
  disbursedBy?: User | string;
  totalPaid: number;
  outstandingBalance: number;
  createdAt: string;
}

export interface Payment {
  _id: string;
  loan: string;
  borrower: string;
  utrNumber: string;
  amount: number;
  paymentDate: string;
  recordedBy: User | string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

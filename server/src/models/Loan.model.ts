import mongoose, { Document, Schema } from 'mongoose';

export type LoanStatus = 'applied' | 'sanctioned' | 'rejected' | 'disbursed' | 'closed';

export interface ILoan extends Document {
  _id: mongoose.Types.ObjectId;
  borrower: mongoose.Types.ObjectId;
  // Loan config
  amount: number;
  tenure: number; // in days
  interestRate: number; // fixed 12% p.a.
  simpleInterest: number;
  totalRepayment: number;
  // Salary slip
  salarySlipUrl?: string;
  salarySlipOriginalName?: string;
  // Status & lifecycle
  status: LoanStatus;
  rejectionReason?: string;
  // Stage timestamps
  appliedAt: Date;
  sanctionedAt?: Date;
  disbursedAt?: Date;
  closedAt?: Date;
  // Executive who handled each stage
  sanctionedBy?: mongoose.Types.ObjectId;
  disbursedBy?: mongoose.Types.ObjectId;
  // Outstanding
  totalPaid: number;
  outstandingBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

const LoanSchema = new Schema<ILoan>(
  {
    borrower: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 50000, max: 500000 },
    tenure: { type: Number, required: true, min: 30, max: 365 },
    interestRate: { type: Number, default: 12 },
    simpleInterest: { type: Number, required: true },
    totalRepayment: { type: Number, required: true },
    salarySlipUrl: { type: String },
    salarySlipOriginalName: { type: String },
    status: {
      type: String,
      enum: ['applied', 'sanctioned', 'rejected', 'disbursed', 'closed'],
      default: 'applied',
    },
    rejectionReason: { type: String },
    appliedAt: { type: Date, default: Date.now },
    sanctionedAt: { type: Date },
    disbursedAt: { type: Date },
    closedAt: { type: Date },
    sanctionedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    disbursedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    totalPaid: { type: Number, default: 0 },
    outstandingBalance: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<ILoan>('Loan', LoanSchema);

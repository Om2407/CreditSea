import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'admin' | 'sales' | 'sanction' | 'disbursement' | 'collection' | 'borrower';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  // Borrower personal details
  pan?: string;
  dateOfBirth?: Date;
  monthlySalary?: number;
  employmentMode?: 'salaried' | 'self-employed' | 'unemployed';
  personalDetailsSubmitted?: boolean;
  breStatus?: 'pending' | 'passed' | 'rejected';
  breRejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: ['admin', 'sales', 'sanction', 'disbursement', 'collection', 'borrower'],
      default: 'borrower',
    },
    pan: { type: String, uppercase: true },
    dateOfBirth: { type: Date },
    monthlySalary: { type: Number },
    employmentMode: {
      type: String,
      enum: ['salaried', 'self-employed', 'unemployed'],
    },
    personalDetailsSubmitted: { type: Boolean, default: false },
    breStatus: {
      type: String,
      enum: ['pending', 'passed', 'rejected'],
      default: 'pending',
    },
    breRejectionReason: { type: String },
  },
  { timestamps: true }
);

// Hash password before save
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);

import { Response } from 'express';
import Loan from '../models/Loan.model';
import User from '../models/User.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { runBRE, calculateLoan } from '../utils/bre';

// POST /api/loans/personal-details — Step 2: Submit personal details + run BRE
export const submitPersonalDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { pan, dateOfBirth, monthlySalary, employmentMode } = req.body;
    const userId = req.user!.id;

    if (!pan || !dateOfBirth || !monthlySalary || !employmentMode) {
      res.status(400).json({ success: false, message: 'All personal details are required.' });
      return;
    }

    // Run BRE on server
    const breResult = runBRE({
      dateOfBirth: new Date(dateOfBirth),
      monthlySalary: Number(monthlySalary),
      pan: pan.toUpperCase(),
      employmentMode,
    });

    if (!breResult.passed) {
      await User.findByIdAndUpdate(userId, {
        pan: pan.toUpperCase(),
        dateOfBirth: new Date(dateOfBirth),
        monthlySalary: Number(monthlySalary),
        employmentMode,
        personalDetailsSubmitted: true,
        breStatus: 'rejected',
        breRejectionReason: breResult.reason,
      });

      res.status(422).json({
        success: false,
        breRejected: true,
        message: breResult.reason,
      });
      return;
    }

    await User.findByIdAndUpdate(userId, {
      pan: pan.toUpperCase(),
      dateOfBirth: new Date(dateOfBirth),
      monthlySalary: Number(monthlySalary),
      employmentMode,
      personalDetailsSubmitted: true,
      breStatus: 'passed',
      breRejectionReason: undefined,
    });

    res.json({
      success: true,
      message: 'Eligibility check passed! You can proceed to upload your salary slip.',
    });
  } catch (error) {
    console.error('Personal details error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/loans/upload-salary-slip — Step 3: Upload salary slip
export const uploadSalarySlip = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const user = await User.findById(userId);

    if (!user || user.breStatus !== 'passed') {
      res.status(403).json({ success: false, message: 'BRE check must be passed before uploading.' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, message: 'Salary slip file is required.' });
      return;
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    res.json({
      success: true,
      message: 'Salary slip uploaded successfully.',
      fileUrl,
      originalName: req.file.originalname,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/loans/apply — Step 4: Apply for loan
export const applyLoan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { amount, tenure, salarySlipUrl, salarySlipOriginalName } = req.body;

    const user = await User.findById(userId);
    if (!user || user.breStatus !== 'passed') {
      res.status(403).json({ success: false, message: 'BRE check must be passed first.' });
      return;
    }

    const parsedAmount = Number(amount);
    const parsedTenure = Number(tenure);

    if (parsedAmount < 50000 || parsedAmount > 500000) {
      res.status(400).json({ success: false, message: 'Loan amount must be between ₹50,000 and ₹5,00,000.' });
      return;
    }

    if (parsedTenure < 30 || parsedTenure > 365) {
      res.status(400).json({ success: false, message: 'Tenure must be between 30 and 365 days.' });
      return;
    }

    // Check for active loan
    const activeLoan = await Loan.findOne({
      borrower: userId,
      status: { $in: ['applied', 'sanctioned', 'disbursed'] },
    });

    if (activeLoan) {
      res.status(409).json({ success: false, message: 'You already have an active loan application.' });
      return;
    }

    const { simpleInterest, totalRepayment } = calculateLoan(parsedAmount, parsedTenure);

    const loan = await Loan.create({
      borrower: userId,
      amount: parsedAmount,
      tenure: parsedTenure,
      interestRate: 12,
      simpleInterest,
      totalRepayment,
      salarySlipUrl,
      salarySlipOriginalName,
      status: 'applied',
      outstandingBalance: totalRepayment,
    });

    res.status(201).json({
      success: true,
      message: 'Loan application submitted successfully!',
      loan,
    });
  } catch (error) {
    console.error('Apply loan error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/loans/my-loans — Borrower's loans
export const getMyLoans = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const loans = await Loan.find({ borrower: req.user!.id })
      .populate('sanctionedBy', 'name')
      .populate('disbursedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, loans });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/loans/:id — Single loan details
export const getLoanById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const loan = await Loan.findById(req.params.id)
      .populate('borrower', 'name email pan monthlySalary employmentMode dateOfBirth')
      .populate('sanctionedBy', 'name email')
      .populate('disbursedBy', 'name email');

    if (!loan) {
      res.status(404).json({ success: false, message: 'Loan not found.' });
      return;
    }

    // Borrowers can only see their own loans
    if (req.user!.role === 'borrower' && loan.borrower._id.toString() !== req.user!.id) {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    res.json({ success: true, loan });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PATCH /api/loans/:id/sanction — Sanction executive approves/rejects
export const sanctionLoan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { action, rejectionReason } = req.body; // action: 'approve' | 'reject'
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      res.status(404).json({ success: false, message: 'Loan not found.' });
      return;
    }

    if (loan.status !== 'applied') {
      res.status(400).json({ success: false, message: `Cannot sanction a loan with status: ${loan.status}` });
      return;
    }

    if (action === 'approve') {
      loan.status = 'sanctioned';
      loan.sanctionedAt = new Date();
      loan.sanctionedBy = req.user!.id as unknown as typeof loan.sanctionedBy;
    } else if (action === 'reject') {
      if (!rejectionReason) {
        res.status(400).json({ success: false, message: 'Rejection reason is required.' });
        return;
      }
      loan.status = 'rejected';
      loan.rejectionReason = rejectionReason;
    } else {
      res.status(400).json({ success: false, message: 'Invalid action. Use "approve" or "reject".' });
      return;
    }

    await loan.save();
    res.json({ success: true, message: `Loan ${action}d successfully.`, loan });
  } catch (error) {
    console.error('Sanction error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PATCH /api/loans/:id/disburse — Disbursement executive marks as disbursed
export const disburseLoan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      res.status(404).json({ success: false, message: 'Loan not found.' });
      return;
    }

    if (loan.status !== 'sanctioned') {
      res.status(400).json({ success: false, message: `Cannot disburse a loan with status: ${loan.status}` });
      return;
    }

    loan.status = 'disbursed';
    loan.disbursedAt = new Date();
    loan.disbursedBy = req.user!.id as unknown as typeof loan.disbursedBy;
    await loan.save();

    res.json({ success: true, message: 'Loan disbursed successfully.', loan });
  } catch (error) {
    console.error('Disburse error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

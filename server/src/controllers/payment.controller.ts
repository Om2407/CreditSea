import { Response } from 'express';
import Payment from '../models/Payment.model';
import Loan from '../models/Loan.model';
import { AuthRequest } from '../middleware/auth.middleware';

// POST /api/payments — Record a payment
export const recordPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { loanId, utrNumber, amount, paymentDate } = req.body;

    if (!loanId || !utrNumber || !amount || !paymentDate) {
      res.status(400).json({ success: false, message: 'loanId, utrNumber, amount, and paymentDate are required.' });
      return;
    }

    const loan = await Loan.findById(loanId);
    if (!loan) {
      res.status(404).json({ success: false, message: 'Loan not found.' });
      return;
    }

    if (loan.status !== 'disbursed') {
      res.status(400).json({ success: false, message: 'Payments can only be recorded for disbursed loans.' });
      return;
    }

    // Check UTR uniqueness globally
    const existingUTR = await Payment.findOne({ utrNumber: utrNumber.trim() });
    if (existingUTR) {
      res.status(409).json({ success: false, message: 'UTR number already exists. Each payment must have a unique UTR.' });
      return;
    }

    const parsedAmount = Number(amount);

    // Validate amount doesn't exceed outstanding balance
    if (parsedAmount <= 0) {
      res.status(400).json({ success: false, message: 'Payment amount must be greater than 0.' });
      return;
    }

    if (parsedAmount > loan.outstandingBalance) {
      res.status(400).json({
        success: false,
        message: `Payment amount (₹${parsedAmount.toLocaleString('en-IN')}) cannot exceed outstanding balance (₹${loan.outstandingBalance.toLocaleString('en-IN')}).`,
      });
      return;
    }

    // Create payment
    const payment = await Payment.create({
      loan: loanId,
      borrower: loan.borrower,
      utrNumber: utrNumber.trim(),
      amount: parsedAmount,
      paymentDate: new Date(paymentDate),
      recordedBy: req.user!.id,
    });

    // Update loan totals
    loan.totalPaid += parsedAmount;
    loan.outstandingBalance = Math.round((loan.outstandingBalance - parsedAmount) * 100) / 100;

    // Auto-close if fully paid
    if (loan.outstandingBalance <= 0) {
      loan.status = 'closed';
      loan.closedAt = new Date();
      loan.outstandingBalance = 0;
    }

    await loan.save();

    res.status(201).json({
      success: true,
      message: loan.status === 'closed'
        ? '🎉 Payment recorded. Loan fully repaid and closed!'
        : 'Payment recorded successfully.',
      payment,
      loan: {
        status: loan.status,
        totalPaid: loan.totalPaid,
        outstandingBalance: loan.outstandingBalance,
        totalRepayment: loan.totalRepayment,
      },
    });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/payments/loan/:loanId — Get all payments for a loan
export const getLoanPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { loanId } = req.params;

    const loan = await Loan.findById(loanId);
    if (!loan) {
      res.status(404).json({ success: false, message: 'Loan not found.' });
      return;
    }

    // Borrowers can only see their own loan payments
    if (req.user!.role === 'borrower' && loan.borrower.toString() !== req.user!.id) {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    const payments = await Payment.find({ loan: loanId })
      .populate('recordedBy', 'name')
      .sort({ paymentDate: -1 });

    res.json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

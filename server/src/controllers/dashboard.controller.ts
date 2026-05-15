import { Response } from 'express';
import User from '../models/User.model';
import Loan from '../models/Loan.model';
import Payment from '../models/Payment.model';
import { AuthRequest } from '../middleware/auth.middleware';

// GET /api/dashboard/sales — Users who signed up but haven't applied
export const getSalesData = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const leads = await User.find({
      role: 'borrower',
    }).select('-password').sort({ createdAt: -1 });

    // Annotate with loan status
    const leadsWithStatus = await Promise.all(
      leads.map(async (user) => {
        const loan = await Loan.findOne({ borrower: user._id }).sort({ createdAt: -1 });
        return {
          ...user.toObject(),
          loanStatus: loan?.status || null,
          hasApplied: !!loan,
        };
      })
    );

    res.json({ success: true, leads: leadsWithStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/dashboard/sanction — Applied loans pending review
export const getSanctionData = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const loans = await Loan.find({ status: 'applied' })
      .populate('borrower', 'name email pan monthlySalary employmentMode dateOfBirth')
      .sort({ appliedAt: -1 });

    res.json({ success: true, loans });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/dashboard/disbursement — Sanctioned loans ready for disbursement
export const getDisbursementData = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const loans = await Loan.find({ status: 'sanctioned' })
      .populate('borrower', 'name email pan')
      .populate('sanctionedBy', 'name')
      .sort({ sanctionedAt: -1 });

    res.json({ success: true, loans });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/dashboard/collection — Active (disbursed) loans
export const getCollectionData = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const loans = await Loan.find({ status: { $in: ['disbursed', 'closed'] } })
      .populate('borrower', 'name email pan')
      .sort({ disbursedAt: -1 });

    const loansWithPayments = await Promise.all(
      loans.map(async (loan) => {
        const payments = await Payment.find({ loan: loan._id }).sort({ paymentDate: -1 });
        return { ...loan.toObject(), payments };
      })
    );

    res.json({ success: true, loans: loansWithPayments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/dashboard/stats — Admin overview stats
export const getDashboardStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [totalBorrowers, applied, sanctioned, disbursed, closed, rejected, totalPayments] = await Promise.all([
      User.countDocuments({ role: 'borrower' }),
      Loan.countDocuments({ status: 'applied' }),
      Loan.countDocuments({ status: 'sanctioned' }),
      Loan.countDocuments({ status: 'disbursed' }),
      Loan.countDocuments({ status: 'closed' }),
      Loan.countDocuments({ status: 'rejected' }),
      Payment.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);

    res.json({
      success: true,
      stats: {
        totalBorrowers,
        applied,
        sanctioned,
        disbursed,
        closed,
        rejected,
        totalCollected: totalPayments[0]?.total || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

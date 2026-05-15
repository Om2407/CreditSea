import { Router } from 'express';
import {
  submitPersonalDetails,
  uploadSalarySlip,
  applyLoan,
  getMyLoans,
  getLoanById,
  sanctionLoan,
  disburseLoan,
} from '../controllers/loan.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { upload } from '../config/multer';

const router = Router();

// Borrower routes
router.post('/personal-details', authenticate, authorize('borrower'), submitPersonalDetails);
router.post('/upload-salary-slip', authenticate, authorize('borrower'), upload.single('salarySlip'), uploadSalarySlip);
router.post('/apply', authenticate, authorize('borrower'), applyLoan);
router.get('/my-loans', authenticate, authorize('borrower'), getMyLoans);

// Shared - borrower sees own, executives see any
router.get('/:id', authenticate, getLoanById);

// Executive routes
router.patch('/:id/sanction', authenticate, authorize('admin', 'sanction'), sanctionLoan);
router.patch('/:id/disburse', authenticate, authorize('admin', 'disbursement'), disburseLoan);

export default router;

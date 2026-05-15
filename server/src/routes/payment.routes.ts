import { Router } from 'express';
import { recordPayment, getLoanPayments } from '../controllers/payment.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, authorize('admin', 'collection'), recordPayment);
router.get('/loan/:loanId', authenticate, getLoanPayments);

export default router;

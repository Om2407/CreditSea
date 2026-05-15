import { Router } from 'express';
import {
  getSalesData,
  getSanctionData,
  getDisbursementData,
  getCollectionData,
  getDashboardStats,
} from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/stats', authenticate, authorize('admin'), getDashboardStats);
router.get('/sales', authenticate, authorize('admin', 'sales'), getSalesData);
router.get('/sanction', authenticate, authorize('admin', 'sanction'), getSanctionData);
router.get('/disbursement', authenticate, authorize('admin', 'disbursement'), getDisbursementData);
router.get('/collection', authenticate, authorize('admin', 'collection'), getCollectionData);

export default router;

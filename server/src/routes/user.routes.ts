import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import User from '../models/User.model';

const router = Router();

// Admin: get all users
router.get('/', authenticate, authorize('admin'), async (_req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

export default router;

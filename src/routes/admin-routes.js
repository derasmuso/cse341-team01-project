import { Router } from 'express';
import { requirePageRole } from '../middleware/auth.js';
import { adminDashboardPage } from '../controllers/admin.js';

const router = Router();

router.get('/dashboard', requirePageRole('admin'), adminDashboardPage);

export default router;
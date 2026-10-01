// src/routes/admin-routes.js

import { Router } from 'express';
import { requirePageRole } from '../middleware/auth.js';
import { 
    adminDashboardPage,
    adminUsersPage
} from '../controllers/admin.js';


const router = Router();

// Admin dashboard route
router.get(
    '/dashboard', 
    requirePageRole('admin'), 
    adminDashboardPage
);

// Admin users page route
router.get(
    '/users', 
    requirePageRole('admin'),
    adminUsersPage
);



export default router;
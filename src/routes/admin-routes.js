// src/routes/admin-routes.js

import { Router } from 'express';

import {
    requirePageLogin,
    requirePageRole
} from '../middleware/auth.js';

import {
    adminDashboardPage,
    adminUsersPage
} from '../controllers/admin.js';

const router = Router();

// Admin dashboard route
router.get(
    '/dashboard',
    requirePageRole('2'),
    adminDashboardPage
);

// Admin users page route
router.get(
    '/users',
    requirePageRole('2'),
    adminUsersPage
);

export default router;
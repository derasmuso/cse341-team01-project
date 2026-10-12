// src/routes/dashboard-routes.js

import { Router } from 'express';

import { requirePageLogin } from '../middleware/auth.js';

import { dashboardPage, profilePage } from '../controllers/dashboard.js';

const router = Router();

router.get('/dashboard', requirePageLogin, dashboardPage);

router.get('/profile', requirePageLogin, profilePage);

export default router;

// src/routes/dashboard-routes.js

import { Router } from 'express';

import { 
    requirePageLogin,
    requirePageRole
} from '../middleware/auth.js';

import {
    dashboardPage,
    profilePage
} from '../controllers/dashboard.js';


const router = Router();

// Dashboard routes
router.get(
    '/dashboard', 
    requirePageLogin, 
    (req, res, next) => {
        if (req.user.role === 'admin') {
            return res.redirect('/admin/dashboard');
        }
        return next();
    },
    dashboardPage
);

router.get(
    '/profile', 
    requirePageLogin, 
    profilePage
);


export default router;
// src/routes/router.js

import { Router } from 'express';

import { homePage, aboutPage, testErrorPage } from './index.js';
import { bookingsAdminPage } from '../controllers/bookings.js';
import { userDashboardPage } from '../controllers/dashboard.js';
import { requirePageLogin, requirePageRole } from '../middleware/auth.js';

import { trainsApi, trainsPage } from './trains.js';

import ejsRoutes from './ejs-routes.js';

import apiRoutes from './api-routes.js';

import authRoutes from './auth-routes.js';
import adminRoutes from './admin-routes.js';

const router = Router();

// API routes
router.use('/api', apiRoutes);

// Home page
router.get('/', homePage);

// Authentication and authorization routes
router.use('/', authRoutes);

// User dashboard
router.get('/dashboard', requirePageLogin, userDashboardPage);

// Admin routes
router.use('/admin', adminRoutes);

// About page
router.get('/about', aboutPage);

// Trains page
router.get('/trains', trainsPage);

// Trains API
router.get('/api/trains', trainsApi);

// EJS routes
router.use('/trips', ejsRoutes);

// Bookings admin page
router.get('/bookings-admin', requirePageRole('admin'), bookingsAdminPage);

// Test 500 error page
router.get('/500', testErrorPage);

export default router;

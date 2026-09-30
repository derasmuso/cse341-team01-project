import { Router } from 'express';

import { homePage, aboutPage, testErrorPage } from './index.js';
import { bookingsAdminPage } from '../controllers/booking.js';

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

// Admin routes
router.use('/admin', adminRoutes);

// About page
router.get('/about', aboutPage);

// Trains page
router.get('/trains', trainsPage);

// Trains API
router.get('/api/trains', trainsApi);

// Bookings admin page
router.get('/bookings-admin', bookingsAdminPage);

// EJS routes
router.use('/trips', ejsRoutes);

// Test 500 error page
router.get('/500', testErrorPage);

export default router;

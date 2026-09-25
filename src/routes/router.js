import railTripsRouter from './trips.js';
import { trainsApi, trainsPage } from './trains.js';
import { Router } from 'express';
import { homePage, aboutPage, testErrorPage } from './index.js';
import authRoutes from './auth-routes.js';
import adminRoutes from './admin-routes.js';

const router = Router();

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

// Rail trips
router.use('/trips', railTripsRouter);

// Test 500 error page
router.get('/500', testErrorPage);

export default router;
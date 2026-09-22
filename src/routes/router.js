import railTripsRouter from './trips.js';
import { trainsApi, trainsPage } from './trains.js';
import apiRoutes from './api-routes.js';
import { Router } from 'express';
import { homePage, aboutPage, testErrorPage } from './index.js';
import { bookingsAdminPage } from '../controllers/bookings.js';

const router = Router();

// Home page
router.get('/', homePage);

// About page
router.get('/about', aboutPage);

// Trains page
router.get('/trains', trainsPage);

// Trains API
router.get('/api/trains', trainsApi);

// Bookings API
router.use('/api', apiRoutes);

// Bookings admin page
router.get('/bookings-admin', bookingsAdminPage);

// Rail trips
router.use('/trips', railTripsRouter);

// Test 500 error page
router.get('/500', testErrorPage);

export default router;
// src/routes/router.js

import railTripsRouter from './trips.js';
import ejsRoutes from './ejs-routes.js';
import apiRoutes from './api-routes.js';
import { trainsApi, trainsPage } from './trains.js';
import { Router } from 'express';
import { homePage, aboutPage, testErrorPage } from './index.js';
import authRoutes from './auth-routes.js';
import adminRoutes from './admin-routes.js';

import apiRouter from './api-routes.js'; //Import API router


const router = Router();

router.use('/api', apiRouter);


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
router.use('/trips', ejsRoutes);

router.use('/api', apiRoutes);

// Test 500 error page
router.get('/500', testErrorPage);

export default router;
// src/routes/trips.js

import { bookingPage, processBookingRequest } from '../controllers/booking.js';
import confirmationPage from './confirm.js';
import { listTripsPage, tripDetailsPage } from '../controllers/trips.js';
import { Router } from 'express';

const router = Router();


/********************************************
 * BOOKING ROUTES
 * ******************************************/

// Book ticket
router.get('/booking/:scheduleId', bookingPage);
router.post('/book', processBookingRequest);

// Booking confirmation page
router.get('/confirmation/:confirmationId', confirmationPage);


/********************************************
 * TRIPS ROUTES
 * ******************************************/

// List all trips
router.get('/', listTripsPage);

// Trip details page
router.get('/:tripId', tripDetailsPage);






export default router;
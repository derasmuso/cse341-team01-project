import { bookingPage, processBookingRequest } from '../controllers/bookings.js';
import confirmationPage from './confirm.js';
import { listTripsPage, tripDetailsPage } from '../controllers/trips.js';
import { Router } from 'express';

const router = Router();

// List all trips
router.get('/', listTripsPage);

// Book ticket
router.get('/booking/:scheduleId', bookingPage);
router.post('/book', processBookingRequest);

// Booking confirmation page
router.get('/confirmation/:bookingId', confirmationPage);

// Trip details page
router.get('/:tripId', tripDetailsPage);

export default router;
// src/routes/book.js

import { Router } from 'express';
import { bookingPage } from '../controllers/booking.js';

const router = Router();

router.get('/booking/:scheduleId', bookingPage);

export default router;
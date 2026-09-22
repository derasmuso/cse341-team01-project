import { Router } from 'express';
import { getAllBookings } from '../controllers/bookings.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Passenger:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *           example: Yuki
 *         lastName:
 *           type: string
 *           example: Tanaka
 *         email:
 *           type: string
 *           example: yuki.tanaka@example.com
 *         phone:
 *           type: string
 *           example: "+81 90-1234-5678"
 *     Booking:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique booking confirmation code.
 *           example: JR4F9X2A1B
 *         scheduleId:
 *           type: string
 *           example: "12"
 *         tripId:
 *           type: string
 *           example: "3"
 *         ticketClass:
 *           type: string
 *           example: standard
 *         selectedDay:
 *           type: string
 *           example: Monday
 *         passengers:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Passenger'
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: Get all bookings
 *     tags:
 *       - Bookings
 *     responses:
 *       200:
 *         description: A list of all bookings.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bookings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booking'
 *       500:
 *         description: Server error while fetching bookings.
 */
router.get('/bookings', getAllBookings);

export default router;

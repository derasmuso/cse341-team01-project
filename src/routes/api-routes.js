// src/routes/api-routes.js

import { Router } from 'express';

import {
    getAllTicketClasses,
    getTicketClassesForDay
} from '../controllers/ticket-classes.js';

import {
    getAllTrips,
    getTripById
} from '../controllers/trips.js';

import { getAllBookings } from '../controllers/booking.js';

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Trip:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: alpine-panorama
 *         name:
 *           type: string
 *           example: Alpine Panorama Express
 *         description:
 *           type: string
 *           example: Journey through the Japanese Alps with stunning mountain views and traditional villages.
 *         region:
 *           type: string
 *           enum: [central, northern, kansai, hokkaido]
 *           example: central
 *         startStation:
 *           type: string
 *           example: nagoya
 *         endStation:
 *           type: string
 *           example: toyama
 *         duration:
 *           type: string
 *           example: 4.5 hours
 *         distance:
 *           type: number
 *           example: 180
 *         highlights:
 *           type: array
 *           items:
 *             type: string
 *           example: [Mount Tateyama views, Hida River gorge]
 *         bestSeason:
 *           type: string
 *           enum: [spring, summer, autumn, winter]
 *           example: autumn
 *         operatingMonths:
 *           type: array
 *           items:
 *             type: integer
 *           example: [4, 5, 6, 7, 8, 9, 10, 11]
 *         imageUrl:
 *           type: string
 *           example: /images/routes/alpine-panorama.png
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 */

/**
 * @openapi
 * /api/trips:
 *   get:
 *     summary: Get all trips
 *     tags:
 *       - Trips
 *     responses:
 *       200:
 *         description: A list of trips
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Trip'
 *       500:
 *         description: Failed to fetch trips
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/trips', getAllTrips);

/**
 * @openapi
 * /api/trips/{id}:
 *   get:
 *     summary: Get one trip by id
 *     tags:
 *       - Trips
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: alpine-panorama
 *         description: The trip's custom id
 *     responses:
 *       200:
 *         description: The matching trip
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Trip'
 *       404:
 *         description: Trip not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to fetch trip
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/trips/:id', getTripById);

/**
 * @openapi
 * /api/ticket-classes:
 *   get:
 *     summary: Get ticket classes
 *     description: Returns all ticket classes, or only the ticket classes available on the requested day when the day query parameter is provided.
 *     tags:
 *       - Ticket Classes
 *     parameters:
 *       - in: query
 *         name: day
 *         required: false
 *         description: Day of the week used to filter available ticket classes.
 *         schema:
 *           type: string
 *           enum:
 *             - monday
 *             - tuesday
 *             - wednesday
 *             - thursday
 *             - friday
 *             - saturday
 *             - sunday
 *         example: monday
 *     responses:
 *       200:
 *         description: Ticket classes retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   class:
 *                     type: string
 *                     enum:
 *                       - standard
 *                       - premium
 *                       - first
 *                     example: standard
 *                   pricePerKm:
 *                     type: number
 *                     example: 80
 *                   amenities:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example:
 *                       - Comfortable seats
 *                       - Large windows
 *                       - Complimentary tea
 *                   description:
 *                     type: string
 *                     example: Comfortable and affordable railway travel.
 *                   availableDays:
 *                     type: array
 *                     items:
 *                       type: string
 *                       enum:
 *                         - monday
 *                         - tuesday
 *                         - wednesday
 *                         - thursday
 *                         - friday
 *                         - saturday
 *                         - sunday
 *                     example:
 *                       - monday
 *                       - tuesday
 *       400:
 *         description: Invalid day query parameter.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid day
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
router.get('/ticket-classes', (req, res) => {
    if (req.query.day !== undefined) {
        return getTicketClassesForDay(req, res);
    }

    return getAllTicketClasses(req, res);
});

/**
 * @openapi
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
 * @openapi
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
 *         description: Failed to fetch bookings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/bookings', getAllBookings);

export default router;

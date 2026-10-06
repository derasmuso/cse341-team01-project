// src/routes/api-routes.js

import { Router } from 'express';

import {
    getAllTicketClasses,
    getTicketClassesForDay,
} from '../controllers/ticket-classes.js';

import { getAllTrips, getTripById } from '../controllers/trips.js';

import {
    getSchedulesForTrip,
    getSchedulesForTripAndMonth,
} from '../controllers/schedules.js';

import {
    getAllBookings,
    getMyBookings,
} from '../controllers/bookings.js';

import { requireApiLogin } from '../middleware/auth.js';

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
 *     summary: Get a page of trips
 *     tags:
 *       - Trips
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number to return
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of trips per page
 *       - in: query
 *         name: region
 *         schema:
 *           type: string
 *           enum: [central, northern, kansai, hokkaido]
 *         description: Only return trips in this region
 *       - in: query
 *         name: season
 *         schema:
 *           type: string
 *           enum: [spring, summer, autumn, winter]
 *         description: Only return trips whose best season matches
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Case-insensitive keyword matched against trip names and descriptions
 * 
 *     responses:
 *       200:
 *         description: One page of trips with pagination metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 trips:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Trip'
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 totalTrips:
 *                   type: integer
 *                   example: 6
 *                 totalPages:
 *                   type: integer
 *                   example: 1
 *       400:
 *         description: Invalid region, season, page, or limit
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * /api/trips/{id}/schedules:
 *   get:
 *     summary: Get schedules for a trip
 *     description: Returns all schedules for a trip, or schedules when the trip operates in the specified month.
 *     tags:
 *       - Schedules
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The trip's custom ID.
 *         schema:
 *           type: string
 *         example: alpine-panorama
 *       - in: query
 *         name: month
 *         required: false
 *         description: Month number used to filter schedules. Must be an integer from 1 to 12.
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         example: 6
 *     responses:
 *       200:
 *         description: Schedules retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   tripId:
 *                     type: string
 *                     example: alpine-panorama
 *                   departureTime:
 *                     type: string
 *                     example: "08:30"
 *                   arrivalTime:
 *                     type: string
 *                     example: "13:00"
 *                   daysOfWeek:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example:
 *                       - monday
 *                       - wednesday
 *                       - friday
 *                   status:
 *                     type: boolean
 *                     example: true
 *       400:
 *         description: Invalid month parameter.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to fetch schedules.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/trips/:id/schedules', (req, res) => {
    if (req.query.month !== undefined) {
        return getSchedulesForTripAndMonth(req, res);
    }

    return getSchedulesForTrip(req, res);
});

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

/**
 * @openapi
 * /api/bookings/mine:
 *   get:
 *     summary: Get the signed-in user's bookings
 *     description: Returns bookings where the signed-in user's email matches one of the passengers.
 *     tags:
 *       - Bookings
 *     responses:
 *       200:
 *         description: The user's bookings, newest first.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bookings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Not signed in, or the session is out of date.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error while fetching bookings.
 */
router.get('/bookings/mine', requireApiLogin, getMyBookings);

export default router;
// src/routes/api-routes.js

import { Router } from 'express';

import {
    getAllTicketClasses,
    getTicketClassesForDay
} from '../controllers/ticket-classes.js';

const router = Router();


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
 *                     example: 0.05
 *                   amenities:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example:
 *                       - Comfortable Seats
 *                       - Large Windows
 *                       - Complimentary Tea
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
 *                       - wednesday
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
    if (req.query.day) {
        return getTicketClassesForDay(req, res);
    }

    return getAllTicketClasses(req, res);
});




export default router;
    


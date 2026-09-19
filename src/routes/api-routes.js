import { Router } from "express";
import { getAllTrips, getTripById } from "../controllers/trips.js";

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
 *     tags: [Trips]
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
router.get("/trips", getAllTrips);

/**
 * @openapi
 * /api/trips/{id}:
 *   get:
 *     summary: Get one trip by id
 *     tags: [Trips]
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
router.get("/trips/:id", getTripById);

export default router;
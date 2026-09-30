import { Router } from 'express';
import { requirePageRole } from '../middleware/auth.js';
import { adminDashboardPage } from '../controllers/admin.js';
import {
    getAllSchedules,
    
} from '../models/schedules.js';
import { getDb } from '../db/connect.js';

const router = Router();

router.get(
    '/dashboard',
    requirePageRole('admin'),
    adminDashboardPage
);

router.get(
    '/trips',
    requirePageRole('admin'),
    async (req, res, next) => {
        try {
            const stations = await getDb()
                .collection('stations')
                .find({})
                .sort({ name: 1 })
                .toArray();

            const schedules = await getAllSchedules();

            const schedulesByTrip = {};

            for (const schedule of schedules) {
                if (!schedulesByTrip[schedule.tripId]) {
                    schedulesByTrip[schedule.tripId] = [];
                }

                schedulesByTrip[schedule.tripId].push(schedule);
            }

            res.render('admin/trips', {
                title: 'Trip Management',
                stations,
                schedules,
                schedulesByTrip,
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
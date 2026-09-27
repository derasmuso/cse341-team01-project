import { getSchedulesByTripId } from "../models/schedules.js";

export async function getSchedulesForTrip(req, res) {
    return sendSchedules(req, res);
}

export async function getSchedulesForTripAndMonth(req, res) {
    return sendSchedules(req, res, Number(req.query.month));
}

async function sendSchedules(req, res, month) {
    try {
        if (month !== undefined && (!Number.isInteger(month) || month < 1 || month > 12)) {
            return res.status(400).json({ error: "Month must be an integer from 1 to 12" });
        }
        const schedules = await getSchedulesByTripId(req.params.id, month);
        return res.status(200).json(schedules);
    } catch (error) {
        console.error("Error fetching schedules:", error);
        return res.status(500).json({ error: "Failed to fetch schedules" });
    }
}
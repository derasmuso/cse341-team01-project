
import Schedule from "./schemas/schedules.js";
import { getDb } from "../db/connect.js";

export const getSchedulesByTripId = async (tripId, month) => {
    try {
        const schedules = await Schedule.find({ tripId }).lean();

        if (month === undefined) {
            return schedules;
        }

        const monthNumber = Number(month);

        if (monthNumber < 1 || monthNumber > 12) {
            return [];
        }

        const db = getDb();

        const trip = await db.collection("trips").findOne(
            { id: tripId },
            { projection: { operatingMonths: 1 } }
        );

        if (!trip || !trip.operatingMonths?.includes(monthNumber)) {
            return [];
        }

        return schedules;
    } catch (error) {
        console.error("Error fetching schedules:", error);
        throw error;
    }
};


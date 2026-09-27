import Schedule from "./schemas/schedules.js";
import Trip from "./schemas/trips.js";

export async function getSchedulesByTripId(tripId, month) {
    const schedules = await Schedule.find({ tripId: String(tripId) }).lean();
    if (month === undefined) {
        return schedules;
    }

    const trip = await Trip.findOne({ id: String(tripId) }).select("operatingMonths").lean();
    return schedules.filter((schedule) => {
        const applicableMonths = schedule.months || trip?.operatingMonths;
        return !applicableMonths?.length || applicableMonths.includes(Number(month));
    });
}

export async function getScheduleById(scheduleId) {
    const numericId = Number(scheduleId);
    if (!Number.isInteger(numericId)) {
        return null;
    }
    return Schedule.findOne({ id: numericId }).lean();
}
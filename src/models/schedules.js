import { getDb } from '../db/connect.js';

// Retrieves a schedule by its ID.
const getScheduleById = async (scheduleId) => {
    return getDb().collection('schedules').findOne({
        id: Number(scheduleId)
    });
};

// Retrieves all schedules.
const getAllSchedules = async () => {
    return getDb()
        .collection('schedules')
        .find({})
        .sort({ id: 1 })
        .toArray();
};

// Retrieves all schedules belonging to a trip.
const getSchedulesByTripId = async (tripId) => {
    return getDb()
        .collection('schedules')
        .find({ tripId })
        .sort({ id: 1 })
        .toArray();
};

// Updates the trip associated with a schedule.
const updateScheduleTrip = async (scheduleId, tripId) => {
    return getDb().collection('schedules').updateOne(
        { id: Number(scheduleId) },
        { $set: { tripId } }
    );
};

export {
    getScheduleById,
    getAllSchedules,
    getSchedulesByTripId,
    updateScheduleTrip
};
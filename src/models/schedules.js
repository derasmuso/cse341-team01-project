
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

// src/models/schedules.js

import Schedule from './schemas/schedules.js';
import { getDb } from '../db/connect.js';

export const getSchedulesByTripId = async (tripId, month) => {
  try {
    if (month !== undefined) {
      const monthNumber = Number(month);

      if (
        !Number.isInteger(monthNumber) ||
        monthNumber < 1 ||
        monthNumber > 12
      ) {
        return [];
      }

      const db = getDb();

      const trip = await db
        .collection('trips')
        .findOne({ id: tripId }, { projection: { operatingMonths: 1 } });

      if (!trip || !trip.operatingMonths?.includes(monthNumber)) {
        return [];
      }
    }

    return await Schedule.find({ tripId }).lean();
  } catch (error) {
    console.error('Error fetching schedules:', error);
    throw error;
  }
};

export const getScheduleById = async (scheduleId) => {
  return getDb()
    .collection('schedules')
    .findOne({ id: Number(scheduleId) });
};


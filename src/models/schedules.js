// src/models/schedules.js

import { getDb } from '../db/connect.js';

// Retrieves a schedule by its ID.
const getScheduleById = async (scheduleId) => {
    return getDb().collection('schedules').findOne({ id: Number(scheduleId) 

    });
};

export { getScheduleById };
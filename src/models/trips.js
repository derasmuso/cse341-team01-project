// src/models/trips.js

import { getDb } from '../db/connect.js';

const getTripById = async (tripId) => {
    return getDb().collection('trips').findOne({ id: tripId });
}

export { getTripById };
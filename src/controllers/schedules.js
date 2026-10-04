// src/controllers/schedules.js

import { getSchedulesByTripId } from '../models/schedules.js';

export const getSchedulesForTrip = async (req, res) => {
  try {
    const { id } = req.params;

    const schedules = await getSchedulesByTripId(id);

    return res.status(200).json(schedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);

    return res.status(500).json({
      error: 'Failed to fetch schedules',
    });
  }
};

export const getSchedulesForTripAndMonth = async (req, res) => {
  const { id } = req.params;
  const { month } = req.query;

  const monthNumber = Number(month);

  if (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) {
    return res.status(400).json({
      error: 'Invalid month. Month must be an integer between 1 and 12.',
    });
  }

  try {
    const schedules = await getSchedulesByTripId(id, monthNumber);

    return res.status(200).json(schedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);

    return res.status(500).json({
      error: 'Failed to fetch schedules',
    });
  }
};

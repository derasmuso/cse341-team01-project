// src/controllers/trips.js

import {
  getTripById as findTripById,
  getAllTrips as findAllTrips,
  getTripsPage as findTripsPage,
  TRIP_REGIONS,
  TRIP_SEASONS
} from '../models/trips.js';

export async function getTripById(req, res) {
  try {
    const { id } = req.params;
    const trip = await findTripById(id);

    if (!trip) {
      return res.status(404).json({
        error: 'Trip not found',
      });
    }

    return res.status(200).json(trip);
  } catch (error) {
    console.error('Error fetching trip:', error);

    return res.status(500).json({
      error: 'Failed to fetch trip',
    });
  }
}

// Returns the fallback when the param is missing, NaN when it isn't a whole number
function parseIntParam(value, fallback) {
  if (value === undefined) {
    return fallback;
  }

  return /^\d+$/.test(value) ? Number(value) : NaN;
}

export async function getAllTrips(req, res) {
  const page = parseIntParam(req.query.page, 1);              // So these two default to 1 and 10. 1 being the page that is displayed to the user. And 10 being the amount of trips that are shown to the user
  const limit = parseIntParam(req.query.limit, 10);

  if (!Number.isInteger(page) || page < 1) {
    return res.status(400).json({
      error: 'page must be an integer of 1 or greater',    //if the page number is less than 1 it gives the 400 error with the 1 or greater message.
    });
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    return res.status(400).json({
      error: 'limit must be an integer from 1 to 50',         //If the amount of trips the user wants to see on one page is more than 50, then it gives the 400 error with the from 1 to 50 message.
    });
  }

  try {
    const { trips, totalTrips } = await findTripsPage({ page, limit });

    return res.status(200).json({
      trips,
      page,
      limit,
      totalTrips,
      totalPages: Math.ceil(totalTrips / limit),      // This returns the trips for the page, the page the user is on, the limit of trips per page, the total amount of trips in the database, and how many pages there are in total based off of how many trips there are
    });
  } catch (error) {
    console.error('Error fetching trips:', error);

    return res.status(500).json({
      error: 'Failed to fetch trips',
    });
  }
}

export async function tripDetailsPage(req, res, next) {
  try {
    const { tripId } = req.params;
    const details = await findTripById(tripId);

    if (!details) {
      const error = new Error('Page Not Found');
      error.status = 404;
      return next(error);
    }

    return res.render('trips/details', {
      title: 'Trip Details',
      details,
    });
  } catch (error) {
    return next(error);
  }
}

export function listTripsPage(req, res) {
  res.render('trips/list', {
    title: 'Scenic Train Trips',
    regions: TRIP_REGIONS,
    seasons: TRIP_SEASONS,
  });
}

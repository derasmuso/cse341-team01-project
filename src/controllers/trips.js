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
  const page = parseIntParam(req.query.page, 1);
  const limit = parseIntParam(req.query.limit, 10);
  const { region, season } = req.query;
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

  if (!Number.isInteger(page) || page < 1) {
    return res.status(400).json({
      error: 'page must be an integer of 1 or greater',
    });
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    return res.status(400).json({
      error: 'limit must be an integer from 1 to 50',
    });
  }

  if (region !== undefined && !TRIP_REGIONS.includes(region)) {
    return res.status(400).json({
      error: `region must be one of: ${TRIP_REGIONS.join(', ')}`,
    });
  }

  if (season !== undefined && !TRIP_SEASONS.includes(season)) {
    return res.status(400).json({
      error: `season must be one of: ${TRIP_SEASONS.join(', ')}`,
    });
  }

  try {
    const { trips, totalTrips } = await findTripsPage({ page, limit, region, season, search });

    return res.status(200).json({
      trips,
      page,
      limit,
      totalTrips,
      totalPages: Math.ceil(totalTrips / limit),
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

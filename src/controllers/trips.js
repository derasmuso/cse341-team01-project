// src/controllers/trips.js

import {

    getTripById as findTripById,
    getAllTrips as findAllTrips,
    updateTrip as updateTripModel,
    deleteTrip as deleteTripModel,
} from "../models/trips.js";
import {
    getAllSchedules,
    getSchedulesByTripId,
} from "../models/schedules.js";

export async function getTripById(req, res) {
    try {
        const { id } = req.params;
        const trip = await findTripById(id);

        if (!trip) {
            return res.status(404).json({
                error: "Trip not found",
            });
        }

        return res.status(200).json(trip);
    } catch (error) {
        console.error("Error fetching trip:", error);

        return res.status(500).json({
            error: "Failed to fetch trip",
        });
      
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

    try {
        const trips = await findAllTrips();

        return res.status(200).json(trips);
    } catch (error) {
        console.error("Error fetching trips:", error);

        return res.status(500).json({
            error: "Failed to fetch trips",
        });
    }
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

export async function updateTrip(req, res) {
    try {
        const { id } = req.params;
        const { scheduleIds, ...tripUpdates } = req.body;

        const updatedTrip = await updateTripModel(
            id,
            tripUpdates
        );

        if (!updatedTrip) {
            return res.status(404).json({
                error: "Trip not found",
            });
        }

        let responseScheduleIds;

        // Only synchronize schedules when scheduleIds is provided
        // as an array in the request body.
        if (Array.isArray(scheduleIds)) {
            const selectedScheduleIds = scheduleIds.map(Number);

            const currentSchedules = await getSchedulesByTripId(id);

            const currentScheduleIds = currentSchedules.map(
                (schedule) => schedule.id
            );

            // Remove schedules that are no longer selected.
            for (const scheduleId of currentScheduleIds) {
                if (!selectedScheduleIds.includes(scheduleId)) {
                    await getDb()
                        .collection("schedules")
                        .updateOne(
                            { id: scheduleId, tripId: id },
                            { $set: { tripId: null } }
                        );
                }
            }

            // Assign selected schedules to this trip.
            for (const scheduleId of selectedScheduleIds) {
                await getDb()
                    .collection("schedules")
                    .updateOne(
                        { id: scheduleId },
                        { $set: { tripId: id } }
                    );
            }

            responseScheduleIds = selectedScheduleIds;
        } else {
            // Preserve existing assignments when scheduleIds is omitted.
            const currentSchedules = await getSchedulesByTripId(id);

            responseScheduleIds = currentSchedules.map(
                (schedule) => schedule.id
            );
        }

        return res.status(200).json({
            ...updatedTrip,
            scheduleIds: responseScheduleIds,
        });
    } catch (error) {
        console.error("Error updating trip:", error);

        return res.status(500).json({
            error: "Failed to update trip",
        });
    }
}


export async function deleteTrip(req, res) {
    try {
        const { id } = req.params;

        const deletedTrip = await deleteTripModel(id);

        if (!deletedTrip) {
            return res.status(404).json({
                error: "Trip not found",
            });
        }

        return res.status(200).json({
            message: "Trip deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting trip:", error);

        return res.status(500).json({
            error: "Failed to delete trip",
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

    res.render("trips/list", {
        title: "Scenic Train Trips",
    });
  
  res.render('trips/list', {
    title: 'Scenic Train Trips',
    regions: TRIP_REGIONS,
    seasons: TRIP_SEASONS,
  });

}

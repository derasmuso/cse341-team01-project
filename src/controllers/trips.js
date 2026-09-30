import { getDb } from "../db/connect.js";
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
    }
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
}

export async function updateTrip(req, res) {
    try {
        const { id } = req.params;
        const {
            scheduleIds,
            ...tripUpdates
        } = req.body;

        const updatedTrip = await updateTripModel(
            id,
            tripUpdates
        );

        if (!updatedTrip) {
            return res.status(404).json({
                error: "Trip not found",
            });
        }

        const selectedScheduleIds = Array.isArray(scheduleIds)
            ? scheduleIds.map(Number)
            : [];

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

        return res.status(200).json({
            ...updatedTrip,
            scheduleIds: selectedScheduleIds,
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
            const error = new Error("Page Not Found");
            error.status = 404;
            return next(error);
        }

        details.schedules = await getDb()
            .collection("schedules")
            .find({ tripId })
            .toArray();

        return res.render("trips/details", {
            title: "Trip Details",
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
}
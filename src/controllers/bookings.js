import { generateBookingReference } from "../includes/helpers.js";
import { getScheduleById } from "../models/schedules.js";
import { getTripById } from "../models/trips.js";
import { createBooking, getAllBookings as findAllBookings, getBookingById as findBookingById } from "../models/bookings.js";
import { getAllTicketClasses } from "../models/ticket-classes.js";
import { getTicketClassesForDay } from "../models/ticket-classes.js";

export async function bookingPage(req, res, next) {
    try {
        const schedule = await getScheduleById(req.params.scheduleId);
        if (!schedule) {
            const error = new Error("Schedule not found");
            error.status = 404;
            return next(error);
        }
        const trip = await getTripById(schedule.tripId);
        if (!trip) {
            const error = new Error("Trip not found");
            error.status = 404;
            return next(error);
        }
        const ticketClasses = await getAllTicketClasses();
        const ticketOptions = ticketClasses.map((ticketClass) => ({
            class: ticketClass.class,
            name: ticketClass.name,
            price: trip.distance * ticketClass.pricePerKm,
            amenities: ticketClass.amenities,
            description: ticketClass.description,
        }));
        return res.render("trips/book", { title: "Book Trip", schedule, ticketOptions });
    } catch (error) {
        return next(error);
    }
}

export async function processBookingRequest(req, res, next) {
    try {
        const { scheduleId, tripId, ticketClass, selectedDay, passengers } = req.body;
        if (!scheduleId || !tripId || !ticketClass || !selectedDay) {
            return res.status(400).send("Please provide valid booking and passenger details.");
        }
        const schedule = await getScheduleById(scheduleId);
        const trip = await getTripById(tripId);
        const availableClasses = await getTicketClassesForDay(selectedDay);
        const selectedClass = availableClasses.find((item) => item.class === ticketClass);
        if (!schedule || schedule.tripId !== tripId || !trip || !schedule.daysOfWeek.includes(selectedDay) || !selectedClass || !Array.isArray(passengers) || passengers.length < 1 || passengers.length > 8) {
            return res.status(400).send("Please provide valid booking and passenger details.");
        }
        const ticketPrice = trip.distance * selectedClass.pricePerKm;
        const booking = await createBooking({
            id: generateBookingReference(),
            createdAt: new Date(),
            scheduleId: String(scheduleId),
            tripId,
            ticketClass,
            ticketName: selectedClass.name,
            selectedDay,
            passengers,
            ticketPrice,
            totalAmount: ticketPrice * passengers.length,
        });
        return res.redirect(`/trips/confirmation/${booking.id}`);
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).send("Please provide valid booking and passenger details.");
        }
        return next(error);
    }
}

export function bookingsAdminPage(req, res) {
    return res.render("bookings", { title: "Bookings" });
}

export async function getAllBookings(req, res) {
    try {
        return res.status(200).json(await findAllBookings());
    } catch (error) {
        console.error("Error fetching bookings:", error);
        return res.status(500).json({ error: "Failed to fetch bookings" });
    }
}

export async function getBookingById(req, res) {
    try {
        const booking = await findBookingById(req.params.id);
        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }
        return res.status(200).json(booking);
    } catch (error) {
        console.error("Error fetching booking:", error);
        return res.status(500).json({ error: "Failed to fetch booking" });
    }
}
import { getDb } from '../db/connect.js';
import { generateConfirmationCode } from '../includes/helpers.js';
import { createBooking, getAllBookings as findAllBookings } from '../models/bookings.js';

/**
 * Renders the booking page for a given schedule.
 */
export async function bookingPage(req, res) {
    const { scheduleId } = req.params;

    const db = getDb();
    const schedule = await db.collection('schedules').findOne({ id: Number(scheduleId) });
    const trip = await db.collection('trips').findOne({ id: schedule.tripId });
    const ticketClasses = await db.collection('ticketClasses').find({}).toArray();
    const ticketOptions = ticketClasses.map((ticketClass) => ({
        class: ticketClass.class,
        name: ticketClass.name,
        price: trip.distance * ticketClass.pricePerKm,
        amenities: ticketClass.amenities,
        description: ticketClass.description
    }));

    res.render('trips/book', {
        title: 'Book Trip',
        schedule,
        ticketOptions
    });
}

/**
 * Handles the booking form submission by creating a new booking via the
 * booking model, then redirecting to the confirmation page.
 */
export async function processBookingRequest(req, res) {
    const booking = {
        id: generateConfirmationCode(),
        createdAt: new Date().toISOString(),
        ...req.body
    };

    await createBooking(booking);

    res.redirect(`/trips/confirmation/${booking.id}`);
}

/**
 * API controller: returns all bookings as JSON.
 */
export async function getAllBookings(req, res) {
    try {
        const bookings = await findAllBookings();
        return res.status(200).json({ bookings });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        return res.status(500).json({ error: 'Failed to fetch bookings' });
    }
}

/**
 * Renders the bookings admin page, which populates its list of bookings
 * client-side by calling the bookings API.
 */
export function bookingsAdminPage(req, res) {
    res.render('bookings', { title: 'Bookings Admin' });
}

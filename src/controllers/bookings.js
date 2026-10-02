import { generateConfirmationCode } from '../includes/helpers.js';

import { getScheduleById } from '../models/schedules.js';
import { getTripById } from '../models/trips.js';
import {
    getAllTicketClasses
} from '../models/ticket-classes.js';
import {
    createBooking,
    getAllBookings as findAllBookings,
    getBookingsByPassengerEmail
} from '../models/bookings.js';

const bookingPage = async (req, res) => {
    const { scheduleId } = req.params;

    const schedule = await getScheduleById(scheduleId);
    console.log('scheduleId:', scheduleId);
    console.log('schedule:', schedule);

    const trip = await getTripById(schedule.tripId);
    console.log('trip:', trip);
    console.log('tripId:', schedule.tripId);

    const ticketClasses = await getAllTicketClasses();

    const ticketOptions = ticketClasses.map((ticketClass) => ({
        class: ticketClass.class,
        name: ticketClass.class,
        price: trip.distance * ticketClass.pricePerKm,
        amenities: ticketClass.amenities,
        description: ticketClass.description
    }));

    res.render('trips/book', {
        title: 'Book Trip',
        schedule,
        ticketOptions
    });
};

const processBookingRequest = async (req, res) => {
    const booking = {
        id: generateConfirmationCode(),
        createdAt: new Date().toISOString(),
        ...req.body
    };

    await createBooking(booking);

    res.redirect(`/trips/confirmation/${booking.id}`);
};

/**
 * API controller: returns all bookings as JSON.
 */
const getAllBookings = async (req, res) => {
    try {
        const bookings = await findAllBookings();
        return res.status(200).json({ bookings });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        return res.status(500).json({ error: 'Failed to fetch bookings' });
    }
};

/**
 * API controller: returns the bookings where the signed-in user's email matches
 * one of the passengers. The email always comes from the session, never from
 * the request, so a user can only ever see their own bookings.
 */
export async function getMyBookings(req, res) {
    // Sessions created before the email was stored need to log in again.
    if (!req.user.email) {
        return res.status(401).json({ error: 'Session is out of date. Please log in again.' });
    }

    try {
        const bookings = await getBookingsByPassengerEmail(req.user.email);
        return res.status(200).json({ bookings });
    } catch (error) {
        console.error('Error fetching bookings for user:', error);
        return res.status(500).json({ error: 'Failed to fetch bookings' });
    }
}

/**
 * Renders the bookings admin page, which populates its list of bookings
 * client-side by calling the bookings API.
 */
const bookingsAdminPage = (req, res) => {
    res.render('bookings', { title: 'Bookings Admin' });
};

export { bookingPage, processBookingRequest, getAllBookings, bookingsAdminPage };

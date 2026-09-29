import { generateConfirmationCode } from '../includes/helpers.js';

import { getScheduleById } from '../models/schedules.js';
import { getTripById } from '../models/trips.js';
import {
    getAllTicketClasses
} from '../models/ticket-classes.js';
import {
    createConfirmation
} from '../models/confirmations.js';

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
    const confirmation = {
        id: generateConfirmationCode(),
        createdAt: new Date().toISOString(),
        ...req.body
    };

    await createConfirmation(confirmation);

    res.redirect(`/trips/confirmation/${confirmation.id}`);
};

export { bookingPage, processBookingRequest };
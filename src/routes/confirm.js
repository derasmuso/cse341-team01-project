import { getBookingById } from '../models/bookings.js';

export default async (req, res) => {
    const { bookingId } = req.params;

    const booking = await getBookingById(bookingId);
    if (!booking) {
        return res.status(404).render('errors/404', { title: 'Booking Not Found' });
    }

    return res.render('trips/confirm', {
        title: 'Trip Confirmation',
        booking
    });
};

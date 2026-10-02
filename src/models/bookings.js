import Booking from './schemas/bookings.js';

/**
 * Creates a new booking document, including its passenger data.
 * @param {object} bookingData - All fields required to create a booking (id, scheduleId,
 *   tripId, ticketClass, selectedDay, passengers, etc.).
 * @returns {Promise<object>} The newly created booking.
 */
export async function createBooking(bookingData) {
    const booking = new Booking(bookingData);
    await booking.save();
    return booking.toObject();
}

/**
 * Retrieves every booking in the collection.
 * @returns {Promise<object[]>} All bookings.
 */
export async function getAllBookings() {
    return Booking.find({}).lean();
}

/**
 * Retrieves a single booking by its booking id.
 * @param {string} id - The booking's unique id (confirmation code).
 * @returns {Promise<object|null>} The matching booking, or null if not found.
 */
export async function getBookingById(id) {
    return Booking.findOne({ id }).lean();
}

/**
 * Retrieves every booking that has a passenger with the given email address,
 * newest first. Matching is case-insensitive (collation strength 2) because
 * passenger emails are stored exactly as they were typed on the booking form.
 * @param {string} email - The email address to look for among the passengers.
 * @returns {Promise<object[]>} The matching bookings.
 */
export async function getBookingsByPassengerEmail(email) {
    return Booking.find({ 'passengers.email': email })
        .collation({ locale: 'en', strength: 2 })
        .sort({ createdAt: -1 })
        .lean();
}

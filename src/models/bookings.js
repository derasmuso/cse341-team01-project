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
 * Retrieves one page of bookings.
 * `_id` is added as a final sort key so bookings with equal sort values always
 * come back in the same order, which keeps the pages from overlapping.
 * @param {object} options
 * @param {object} [options.filter={}] - MongoDB filter applied before paging.
 * @param {string} options.sortBy - Booking field to sort by.
 * @param {1|-1} options.sortDirection - 1 for ascending, -1 for descending.
 * @param {number} options.skip - Number of bookings to skip.
 * @param {number} options.limit - Maximum number of bookings to return.
 * @returns {Promise<object[]>} The bookings on the requested page.
 */
export async function getBookingsPage({ filter = {}, sortBy, sortDirection, skip, limit }) {
    return Booking.find(filter)
        .sort({ [sortBy]: sortDirection, _id: sortDirection })
        .skip(skip)
        .limit(limit)
        .lean();
}

/**
 * Counts the bookings that match a filter, ignoring paging.
 * @param {object} [filter={}] - MongoDB filter.
 * @returns {Promise<number>} The total number of matching bookings.
 */
export async function countBookings(filter = {}) {
    return Booking.countDocuments(filter);
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

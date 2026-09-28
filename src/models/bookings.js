import Booking from "./schemas/bookings.js";

export async function createBooking(bookingData) {
    return Booking.create(bookingData);
}

export async function getAllBookings() {
    return Booking.find({}).sort({ createdAt: -1 }).lean();
}

export async function getBookingById(id) {
    return Booking.findOne({ id: String(id) }).lean();
}
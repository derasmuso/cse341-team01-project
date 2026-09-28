import mongoose from "mongoose";

const passengerSchema = new mongoose.Schema({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
}, { _id: false });

const bookingSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true, trim: true },
    createdAt: { type: Date, default: Date.now },
    scheduleId: { type: String, required: true },
    tripId: { type: String, required: true, trim: true },
    ticketClass: { type: String, required: true, trim: true },
    selectedDay: { type: String, required: true, trim: true },
    passengers: { type: [passengerSchema], required: true, validate: (value) => value.length > 0 },
    ticketName: { type: String, trim: true },
    ticketPrice: { type: Number, min: 0 },
    totalAmount: { type: Number, min: 0 },
});

const Booking = mongoose.model("Booking", bookingSchema, "bookings");

export default Booking;
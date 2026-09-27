import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    tripId: { type: String, required: true, trim: true, index: true },
    departureTime: { type: String, required: true },
    arrivalTime: { type: String, required: true },
    daysOfWeek: { type: [String], default: [] },
    months: { type: [Number], default: undefined },
    status: { type: Boolean, default: true },
});

const Schedule = mongoose.model("Schedule", scheduleSchema, "schedules");

export default Schedule;
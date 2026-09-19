import mongoose from "mongoose";

const tripSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    region: {
        type: String,
        required: true,
        enum: ["central", "northern", "kansai", "hokkaido"],
    },
    startStation: {
        type: String,
        required: true,
        trim: true,
    },
    endStation: {
        type: String,
        required: true,
        trim: true,
    },
    duration: {
        type: String,
        required: true,
        trim: true,
    },
    distance: {
        type: Number,
        required: true,
        min: 0,
    },
    highlights: {
        type: [String],
        default: [],
    },
    bestSeason: {
        type: String,
        required: true,
        enum: ["spring", "summer", "autumn", "winter"],
    },
    operatingMonths: {
        type: [Number],
        default: [],
        validate: {
            validator: (months) => months.every((m) => m >= 1 && m <= 12),
            message: "operatingMonths must contain numbers from 1 to 12",
        },
    },
    imageUrl: {
        type: String,
        required: false,
        trim: true,
    },
});

const Trip = mongoose.model("Trip", tripSchema);

export default Trip;
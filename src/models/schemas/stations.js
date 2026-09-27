import mongoose from "mongoose";

const stationSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    prefecture: { type: String, required: true, trim: true },
    region: {
        type: String,
        required: true,
        enum: ["central", "northern", "kansai", "hokkaido"],
    },
    facilities: { type: [String], default: [] },
    description: { type: String, required: true, trim: true },
});

const Station = mongoose.model("Station", stationSchema, "stations");

export default Station;
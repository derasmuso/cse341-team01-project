import Trip from "./schemas/trips.js";

export async function getTripById(id) {
    return Trip.findOne({ id }).lean();
}

export async function getAllTrips() {
    return Trip.find({}).lean();
}

export async function updateTrip(id, updates) {
    const allowedFields = [
        "name",
        "description",
        "price",
        "image",
        "duration",
        "distance",
        "difficulty",
        "startStationId",
        "endStationId",
    ];

    const safeUpdates = Object.fromEntries(
        Object.entries(updates).filter(([key]) =>
            allowedFields.includes(key)
        )
    );

    return Trip.findOneAndUpdate(
        { id },
        { $set: safeUpdates },
        { new: true, runValidators: true }
    ).lean();
}


export async function deleteTrip(id) {
    return Trip.findOneAndDelete({ id }).lean();
}

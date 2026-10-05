import Trip from './schemas/trips.js';

export async function getTripById(id) {
  return Trip.findOne({ id }).lean();
}

export async function getAllTrips() {
  return Trip.find({}).lean();
}

export async function getTripsPage({ page, limit }) {
  const skip = (page - 1) * limit; // when the user is on the first page, show the first 10 trips. If the user is on the second page, skip the first 10 trips and display the second set of 10 trips, etc

  const [trips, totalTrips] = await Promise.all([
    Trip.find({}).sort({ name: 1, id: 1 }).skip(skip).limit(limit).lean(), // get the trips from the database, sort them by name, then only give the trips for the page the user is on
    Trip.countDocuments({}),
  ]);

  return { trips, totalTrips };
}

export const TRIP_REGIONS = Trip.schema.path('region').enumValues;
export const TRIP_SEASONS = Trip.schema.path('bestSeason').enumValues;

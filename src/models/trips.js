import Trip from './schemas/trips.js';

export async function getTripById(id) {
  return Trip.findOne({ id }).lean();
}

export async function getAllTrips() {
  return Trip.find({}).lean();
}

// Escapes regex characters so a search like "(" or ".*" matches as plain text
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildTripFilter({ region, season, search }) {
  const filter = {};

  if (region) {
    filter.region = region;
  }

  if (season) {
    filter.bestSeason = season;
  }

  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: pattern }, { description: pattern }];
  }

  return filter;
}

export async function getTripsPage({ page, limit, region, season, search }) {
  const skip = (page - 1) * limit;
  const filter = buildTripFilter({ region, season, search });

  const [trips, totalTrips] = await Promise.all([
    Trip.find(filter).sort({ name: 1, id: 1 }).skip(skip).limit(limit).lean(),
    Trip.countDocuments(filter),
  ]);

  return { trips, totalTrips };
}

export const TRIP_REGIONS = Trip.schema.path('region').enumValues;
export const TRIP_SEASONS = Trip.schema.path('bestSeason').enumValues;

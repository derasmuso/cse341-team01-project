import Station from './schemas/stations.js';

export async function getAllStations() {
  return Station.find({}).lean();
}

export async function getStationById(id) {
  return Station.findOne({ id: String(id) }).lean();
}
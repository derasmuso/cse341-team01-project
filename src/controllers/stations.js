
import { getDb } from '../db/connect.js';

export async function getAllStations(req, res) {
  try {
    const stations = await getDb()
      .collection('stations')
      .find({})
      .sort({ name: 1 })
      .toArray();

    return res.status(200).json({ stations });
  } catch (error) {
    console.error('Failed to fetch stations:', error);
    return res.status(500).json({ error: 'Failed to fetch stations' });
  }
}

export async function getStationById(req, res) {
  try {
    const station = await getDb()
      .collection('stations')
      .findOne({ id: req.params.id });

    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }

    return res.status(200).json({ station });
  } catch (error) {
    console.error('Failed to fetch station:', error);
    return res.status(500).json({ error: 'Failed to fetch station' });
  }
}
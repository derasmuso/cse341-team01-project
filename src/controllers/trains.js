import {
  getTrainById as findTrainById,
  getAllTrains as findAllTrains,
} from '../models/trains.js';
export async function getTrainById(req, res) {
  try {
    const { id } = req.params;
    const train = await findTrainById(id);
    if (!train) {
      return res.status(404).json({
        error: 'Train not found',
      });
    }
    return res.status(200).json(train);
  } catch (error) {
    console.error('Error fetching train:', error);
    return res.status(500).json({
      error: 'Failed to fetch train',
    });
  }
}
export async function getAllTrains(req, res) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1
    ) {
      return res.status(400).json({
        error: 'Page and limit must be positive integers',
      });
    }

    const trains = await findAllTrains();

    const totalItems = trains.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const paginatedTrains = trains.slice(startIndex, startIndex + limit);

    return res.status(200).json({
      data: paginatedTrains,
      metadata: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching trains:', error);
    return res.status(500).json({
      error: 'Failed to fetch trains',
    });
  }
}

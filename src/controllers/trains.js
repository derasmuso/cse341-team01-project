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
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = 10;
    const search = req.query.search?.trim() || '';

    const allTrains = await findAllTrains();

    const filteredTrains = search
      ? allTrains.filter((train) => {
          const searchText = [
            train.name,
            train.operator,
            train.type,
            train.powerSource,
            train.bestFor,
            train.description,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          return searchText.includes(search.toLowerCase());
        })
      : allTrains;

    const totalItems = filteredTrains.length;
    const totalPages = Math.max(Math.ceil(totalItems / limit), 1);
    const validPage = Math.min(page, totalPages);

    const startIndex = (validPage - 1) * limit;
    const trains = filteredTrains.slice(startIndex, startIndex + limit);

    return res.status(200).json({
      data: trains,
      metadata: {
        page: validPage,
        limit,
        totalItems,
        totalPages,
        search,
      },
    });
  } catch (error) {
    console.error('Error fetching trains:', error);
    return res.status(500).json({
      error: 'Failed to fetch trains',
    });
  }
}
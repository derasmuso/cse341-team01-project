// src/controllers/trains.js
import { getDb } from '../db/connect.js';

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

/**
 * Parse a query value into a positive integer.
 * Returns `fallback` when the value is missing/empty.
 * Returns `null` when the value is present but invalid.
 */
function parsePositiveInt(value, fallback) {
  if (value === undefined || value === '') return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) return null;
  return n;
}

const trainsPage = (req, res) => {
  res.render('trains', { title: 'Trains' });
};

const trainsApi = async (req, res, next) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const pageSize = parsePositiveInt(req.query.pageSize, DEFAULT_PAGE_SIZE);

    if (page === null) {
      return res.status(400).json({ error: 'page must be a positive integer' });
    }
    if (pageSize === null || pageSize > MAX_PAGE_SIZE) {
      return res
        .status(400)
        .json({ error: `pageSize must be an integer between 1 and ${MAX_PAGE_SIZE}` });
    }

    const collection = getDb().collection('trains');
    const total = await collection.countDocuments({});
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const skip = (page - 1) * pageSize;

    const trains = await collection
      .find({})
      .skip(skip)
      .limit(pageSize)
      .toArray();

    return res.json({
      trains,
      metadata: { total, page, pageSize, totalPages },
    });
  } catch (error) {
    return next(error);
  }
};

export { trainsApi, trainsPage };
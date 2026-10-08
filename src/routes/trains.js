import { getDb } from '../db/connect.js';

const trainsPage = (req, res) => {
  res.render('trains', { title: 'Trains' });
};

const trainsApi = async (req, res, next) => {
    try {
        const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
        const limit = 10;
        const skip = (page - 1) * limit;

        const collection = getDb().collection('trains');

        const [trains, totalItems] = await Promise.all([
            collection.find({}).skip(skip).limit(limit).toArray(),
            collection.countDocuments({})
        ]);

        const totalPages = Math.ceil(totalItems / limit);

        return res.json({
            trains,
            meta: {
                page,
                limit,
                totalItems,
                totalPages
            }
        });
    } catch (error) {
        return next(error);
    }
};

export { trainsApi, trainsPage };

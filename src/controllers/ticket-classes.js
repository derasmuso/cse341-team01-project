import {
    getAllTicketClasses as getAllTicketClassesModel,
    getTicketClassesForDay as getTicketClassesForDayModel
} from '../models/ticket-classes.js';

const validDays = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday'
];

/**
 * Retrieves all ticket classes.
 */
const getAllTicketClasses = async (req, res) => {
    try {
        const ticketClasses = await getAllTicketClassesModel();

        return res.status(200).json(ticketClasses);
    } catch (error) {
        console.error('Error retrieving ticket classes:', error);

        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

/**
 * Retrieves ticket classes available on a specific day.
 */
const getTicketClassesForDay = async (req, res) => {
    const { day } = req.query;

    if (
        typeof day !== 'string' ||
        !validDays.includes(day.toLowerCase())
    ) {
        return res.status(400).json({
            message: 'Invalid day'
        });
    }

    try {
        const ticketClasses = await getTicketClassesForDayModel(
            day.toLowerCase()
        );

        return res.status(200).json(ticketClasses);
    } catch (error) {
        console.error(
            'Error retrieving ticket classes for day:',
            error
        );

        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

export {
    getAllTicketClasses,
    getTicketClassesForDay
};
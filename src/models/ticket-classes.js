// src/models/ticket-classes.js

import TicketClass from './schemas/ticket-classes.js';

/**
 * Retrieves all ticket classes.
 *
 * @returns {Promise<Array>} All ticket classes.
 */
const getAllTicketClasses = async () => {
    return TicketClass.find({});
};

/**
 * Retrieves ticket classes available on a specific day.
 *
 * @param {string} day - Day of the week.
 * @returns {Promise<Array>} Ticket classes available on the requested day.
 */
const getTicketClassesForDay = async (day) => {
    return TicketClass.find({
        availableDays: day
    });
};

export {
    getAllTicketClasses,
    getTicketClassesForDay
};
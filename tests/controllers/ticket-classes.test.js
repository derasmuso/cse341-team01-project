import { beforeEach, describe, expect, test, vi } from 'vitest';

import {
    getAllTicketClasses,
    getTicketClassesForDay
} from '../../src/controllers/ticket-classes.js';

import * as ticketClassModel from '../../src/models/ticket-classes.js';

const createResponse = () => {
    const response = {};

    response.status = vi.fn().mockReturnValue(response);
    response.json = vi.fn().mockReturnValue(response);

    return response;
};

describe('Ticket class controller', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    describe('getAllTicketClasses', () => {
        test('returns all ticket classes with a 200 response', async () => {
            const ticketClasses = [
                {
                    class: 'standard',
                    pricePerKm: 80,
                    amenities: ['Comfortable seats'],
                    description: 'Standard class',
                    availableDays: ['tuesday', 'thursday']
                },
                {
                    class: 'premium',
                    pricePerKm: 150,
                    amenities: ['Meal service'],
                    description: 'Premium class',
                    availableDays: ['monday', 'wednesday']
                }
            ];

            vi.spyOn(
                ticketClassModel,
                'getAllTicketClasses'
            ).mockResolvedValue(ticketClasses);

            const req = {};
            const res = createResponse();

            await getAllTicketClasses(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(ticketClasses);
        });

        test('returns a 500 response when the model fails', async () => {
            vi.spyOn(
                ticketClassModel,
                'getAllTicketClasses'
            ).mockRejectedValue(
                new Error('Database error')
            );

            const req = {};
            const res = createResponse();

            await getAllTicketClasses(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Internal server error'
            });
        });
    });

    describe('getTicketClassesForDay', () => {
        test('returns ticket classes for a valid day', async () => {
            const ticketClasses = [
                {
                    class: 'standard',
                    pricePerKm: 80,
                    amenities: ['Comfortable seats'],
                    description: 'Standard class',
                    availableDays: ['tuesday', 'thursday']
                }
            ];

            vi.spyOn(
                ticketClassModel,
                'getTicketClassesForDay'
            ).mockResolvedValue(ticketClasses);

            const req = {
                query: {
                    day: 'Tuesday'
                }
            };

            const res = createResponse();

            await getTicketClassesForDay(req, res);

            expect(
                ticketClassModel.getTicketClassesForDay
            ).toHaveBeenCalledWith('tuesday');

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(ticketClasses);
        });

        test('returns an empty result when no classes are available', async () => {
            vi.spyOn(
                ticketClassModel,
                'getTicketClassesForDay'
            ).mockResolvedValue([]);

            const req = {
                query: {
                    day: 'sunday'
                }
            };

            const res = createResponse();

            await getTicketClassesForDay(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([]);
        });

        test('returns 400 for an invalid day', async () => {
            const req = {
                query: {
                    day: 'invalid'
                }
            };

            const res = createResponse();

            await getTicketClassesForDay(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Invalid day'
            });

            expect(
                ticketClassModel.getTicketClassesForDay
            ).not.toHaveBeenCalled();
        });

        test('returns 400 when the day is missing', async () => {
            const req = {
                query: {}
            };

            const res = createResponse();

            await getTicketClassesForDay(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Invalid day'
            });
        });

        test('returns 500 when the model fails', async () => {
            vi.spyOn(
                ticketClassModel,
                'getTicketClassesForDay'
            ).mockRejectedValue(
                new Error('Database error')
            );

            const req = {
                query: {
                    day: 'monday'
                }
            };

            const res = createResponse();

            await getTicketClassesForDay(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Internal server error'
            });
        });
    });
});
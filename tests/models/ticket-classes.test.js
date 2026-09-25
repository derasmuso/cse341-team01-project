import { describe, expect, test, vi } from 'vitest';

import {
    getAllTicketClasses,
    getTicketClassesForDay
} from '../../src/models/ticket-classes.js';

import TicketClass from '../../src/models/schemas/ticket-classes.js';

import { getDb } from '../../src/db/connect.js';

describe('Ticket class model', () => {
    test('getAllTicketClasses returns all ticket classes', async () => {
        await getDb().collection('ticketClasses').insertMany([
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
        ]);

        const ticketClasses = await getAllTicketClasses();

        expect(ticketClasses).toHaveLength(2);
        expect(ticketClasses).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    class: 'standard',
                    pricePerKm: 80
                }),
                expect.objectContaining({
                    class: 'premium',
                    pricePerKm: 150
                })
            ])
        );
    });

    test('getTicketClassesForDay returns only ticket classes available for that day', async () => {
        await getDb().collection('ticketClasses').insertMany([
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
        ]);

        const ticketClasses = await getTicketClassesForDay('tuesday');

        expect(ticketClasses).toHaveLength(1);
        expect(ticketClasses[0].class).toBe('standard');
    });

    test('getTicketClassesForDay returns an empty result when no classes match', async () => {
        await getDb().collection('ticketClasses').insertOne({
            class: 'standard',
            pricePerKm: 80,
            amenities: ['Comfortable seats'],
            description: 'Standard class',
            availableDays: ['tuesday']
        });

        const ticketClasses = await getTicketClassesForDay('sunday');

        expect(ticketClasses).toEqual([]);
    });

    test('getAllTicketClasses propagates database errors', async () => {
        const findSpy = vi
            .spyOn(TicketClass, 'find')
            .mockRejectedValueOnce(new Error('Database error'));

        await expect(getAllTicketClasses()).rejects.toThrow(
            'Database error'
        );

        findSpy.mockRestore();
    });

    test('getTicketClassesForDay propagates database errors', async () => {
        const findSpy = vi
            .spyOn(TicketClass, 'find')
            .mockRejectedValueOnce(new Error('Database error'));

        await expect(
            getTicketClassesForDay('monday')
        ).rejects.toThrow('Database error');

        findSpy.mockRestore();
    });
});
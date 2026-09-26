import { describe, expect, test, vi } from 'vitest';

import {
    getAllTicketClasses,
    getTicketClassesForDay
} from '../../src/models/ticket-classes.js';

import TicketClass from '../../src/models/schemas/ticket-classes.js';

describe('Ticket class model', () => {
    test('getAllTicketClasses returns all ticket classes', async () => {
        const ticketClasses =
            await getAllTicketClasses();

        expect(ticketClasses).toHaveLength(3);

        expect(ticketClasses).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    class: 'standard',
                    pricePerKm: 80
                }),
                expect.objectContaining({
                    class: 'premium',
                    pricePerKm: 150
                }),
                expect.objectContaining({
                    class: 'first',
                    pricePerKm: 250
                })
            ])
        );
    });

    test('getTicketClassesForDay returns only ticket classes available for that day', async () => {
        const ticketClasses =
            await getTicketClassesForDay('tuesday');

        expect(ticketClasses).toHaveLength(2);

        expect(ticketClasses).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    class: 'standard'
                }),
                expect.objectContaining({
                    class: 'first'
                })
            ])
        );

        expect(ticketClasses).not.toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    class: 'premium'
                })
            ])
        );
    });

    test('getTicketClassesForDay returns an empty array when no classes match', async () => {
        const ticketClasses =
            await getTicketClassesForDay('invalid-day');

        expect(ticketClasses).toEqual([]);
    });

    test('getAllTicketClasses propagates database errors', async () => {
        const findSpy = vi
            .spyOn(TicketClass, 'find')
            .mockRejectedValueOnce(
                new Error('Database error')
            );

        await expect(
            getAllTicketClasses()
        ).rejects.toThrow('Database error');

        findSpy.mockRestore();
    });

    test('getTicketClassesForDay propagates database errors', async () => {
        const findSpy = vi
            .spyOn(TicketClass, 'find')
            .mockRejectedValueOnce(
                new Error('Database error')
            );

        await expect(
            getTicketClassesForDay('monday')
        ).rejects.toThrow('Database error');

        findSpy.mockRestore();
    });
});
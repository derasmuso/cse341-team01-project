// tests/routes/bookings-api.test.js

import { beforeEach, describe, expect, test } from 'vitest';

import request from 'supertest';

import app from '../../app.js';
import { createBooking } from '../../src/models/bookings.js';

const TICKET_CLASSES = ['standard', 'premium', 'first'];

/**
 * Seeds the test database with bookings whose createdAt dates are one day apart.
 * Booking 1 is the oldest and booking `count` is the newest.
 */
const seedBookings = async (count) => {
    for (let i = 1; i <= count; i += 1) {
        await createBooking({
            id: `JR${String(i).padStart(3, '0')}`,
            scheduleId: '1',
            tripId: '1',
            ticketClass: TICKET_CLASSES[i % TICKET_CLASSES.length],
            selectedDay: 'Monday',
            passengers: [{
                firstName: 'Yuki',
                lastName: 'Tanaka',
                email: 'yuki@example.com',
                phone: '555-0100'
            }],
            createdAt: new Date(Date.UTC(2026, 0, i))
        });
    }
};

describe('GET /api/bookings pagination', () => {
    beforeEach(async () => {
        await seedBookings(25);
    });

    test('returns the first 10 bookings, newest first, with metadata by default', async () => {
        const response = await request(app).get('/api/bookings');

        expect(response.status).toBe(200);
        expect(response.body.bookings).toHaveLength(10);
        expect(response.body.bookings[0].id).toBe('JR025');
        expect(response.body.bookings[9].id).toBe('JR016');
        expect(response.body.meta).toEqual({
            totalItems: 25,
            totalPages: 3,
            page: 1,
            limit: 10,
            sortBy: 'createdAt',
            sortOrder: 'desc',
            filters: {}
        });
    });

    test('returns the next bookings for page 2 without repeating page 1', async () => {
        const response = await request(app).get('/api/bookings?page=2&limit=10');

        expect(response.status).toBe(200);
        expect(response.body.bookings.map((booking) => booking.id)).toEqual([
            'JR015', 'JR014', 'JR013', 'JR012', 'JR011',
            'JR010', 'JR009', 'JR008', 'JR007', 'JR006'
        ]);
        expect(response.body.meta.page).toBe(2);
    });

    test('returns a partial last page', async () => {
        const response = await request(app).get('/api/bookings?page=3');

        expect(response.status).toBe(200);
        expect(response.body.bookings).toHaveLength(5);
        expect(response.body.meta.totalPages).toBe(3);
    });

    test('returns an empty list for a page past the end', async () => {
        const response = await request(app).get('/api/bookings?page=99');

        expect(response.status).toBe(200);
        expect(response.body.bookings).toEqual([]);
        expect(response.body.meta.totalItems).toBe(25);
        expect(response.body.meta.page).toBe(99);
    });

    test('honors limit', async () => {
        const response = await request(app).get('/api/bookings?limit=5');

        expect(response.body.bookings).toHaveLength(5);
        expect(response.body.meta.limit).toBe(5);
        expect(response.body.meta.totalPages).toBe(5);
    });

    test('sorts ascending by booking date when asked', async () => {
        const response = await request(app).get('/api/bookings?sortOrder=asc');

        expect(response.status).toBe(200);
        expect(response.body.bookings[0].id).toBe('JR001');
        expect(response.body.meta.sortOrder).toBe('asc');
    });

    test('sorts by ticket class', async () => {
        const response = await request(app).get('/api/bookings?sortBy=ticketClass&sortOrder=asc&limit=25');

        const classes = response.body.bookings.map((booking) => booking.ticketClass);

        expect(response.status).toBe(200);
        expect(classes).toEqual([...classes].sort());
        expect(response.body.meta.sortBy).toBe('ticketClass');
    });

    test('returns an empty first page with zero totals when there are no bookings', async () => {
        const { getDb } = await import('../../src/db/connect.js');
        await getDb().collection('bookings').deleteMany({});

        const response = await request(app).get('/api/bookings');

        expect(response.status).toBe(200);
        expect(response.body.bookings).toEqual([]);
        expect(response.body.meta.totalItems).toBe(0);
        expect(response.body.meta.totalPages).toBe(0);
    });
});

describe('GET /api/bookings validation', () => {
    test.each([
        ['page=0', 'page must be between 1 and 9007199254740991'],
        ['page=-1', 'page must be a whole number'],
        ['page=abc', 'page must be a whole number'],
        ['page=1.5', 'page must be a whole number'],
        ['page=1&page=2', 'page must be a whole number'],
        ['limit=0', 'limit must be between 1 and 100'],
        ['limit=101', 'limit must be between 1 and 100'],
        ['limit=ten', 'limit must be a whole number'],
        ['sortBy=passwordHash', 'sortBy must be one of: createdAt, ticketClass, selectedDay'],
        ['sortOrder=sideways', 'sortOrder must be one of: asc, desc']
    ])('returns 400 for %s', async (query, message) => {
        const response = await request(app).get(`/api/bookings?${query}`);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: message });
    });
});

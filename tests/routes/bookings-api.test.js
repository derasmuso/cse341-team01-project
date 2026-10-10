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
      passengers: [
        {
          firstName: 'Yuki',
          lastName: 'Tanaka',
          email: 'yuki@example.com',
          phone: '555-0100',
        },
      ],
      createdAt: new Date(Date.UTC(2026, 0, i)),
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
      filters: {},
    });
  });

  test('returns the next bookings for page 2 without repeating page 1', async () => {
    const response = await request(app).get('/api/bookings?page=2&limit=10');

    expect(response.status).toBe(200);
    expect(response.body.bookings.map((booking) => booking.id)).toEqual([
      'JR015',
      'JR014',
      'JR013',
      'JR012',
      'JR011',
      'JR010',
      'JR009',
      'JR008',
      'JR007',
      'JR006',
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
    const response = await request(app).get(
      '/api/bookings?sortBy=ticketClass&sortOrder=asc&limit=25'
    );

    const classes = response.body.bookings.map(
      (booking) => booking.ticketClass
    );

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
    [
      'sortBy=passwordHash',
      'sortBy must be one of: createdAt, ticketClass, selectedDay',
    ],
    ['sortOrder=sideways', 'sortOrder must be one of: asc, desc'],
  ])('returns 400 for %s', async (query, message) => {
    const response = await request(app).get(`/api/bookings?${query}`);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: message });
  });
});

// With the seed data above, booking i is made on 2026-01-i, and its class is
// first for i = 2, 5, ... (8 bookings), premium for i = 1, 4, ... (9 bookings)
// and standard for i = 3, 6, ... (8 bookings).
describe('GET /api/bookings filtering', () => {
  beforeEach(async () => {
    await seedBookings(25);
  });

  test('filters by ticket class and reports it in the metadata', async () => {
    const response = await request(app).get(
      '/api/bookings?ticketClass=premium&limit=25'
    );

    expect(response.status).toBe(200);
    expect(response.body.bookings).toHaveLength(9);
    expect(
      response.body.bookings.every(
        (booking) => booking.ticketClass === 'premium'
      )
    ).toBe(true);
    expect(response.body.meta.totalItems).toBe(9);
    expect(response.body.meta.filters).toEqual({ ticketClass: 'premium' });
  });

  test('filters from a start date, including that day', async () => {
    const response = await request(app).get(
      '/api/bookings?startDate=2026-01-20&limit=25'
    );

    expect(response.body.meta.totalItems).toBe(6);
    expect(response.body.bookings.map((booking) => booking.id).sort()).toEqual([
      'JR020',
      'JR021',
      'JR022',
      'JR023',
      'JR024',
      'JR025',
    ]);
    expect(response.body.meta.filters).toEqual({ startDate: '2026-01-20' });
  });

  test('filters up to an end date, including that day', async () => {
    const response = await request(app).get(
      '/api/bookings?endDate=2026-01-05&limit=25'
    );

    expect(response.body.meta.totalItems).toBe(5);
    expect(response.body.bookings.map((booking) => booking.id)).toContain(
      'JR005'
    );
  });

  test('filters by a date range that includes both end days', async () => {
    const response = await request(app).get(
      '/api/bookings?startDate=2026-01-10&endDate=2026-01-12&sortOrder=asc'
    );

    expect(response.status).toBe(200);
    expect(response.body.bookings.map((booking) => booking.id)).toEqual([
      'JR010',
      'JR011',
      'JR012',
    ]);
    expect(response.body.meta.filters).toEqual({
      startDate: '2026-01-10',
      endDate: '2026-01-12',
    });
  });

  test('includes a booking made late in the day on the end date', async () => {
    await createBooking({
      id: 'JRLATE',
      scheduleId: '1',
      tripId: '1',
      ticketClass: 'standard',
      selectedDay: 'Monday',
      passengers: [
        {
          firstName: 'A',
          lastName: 'B',
          email: 'a@example.com',
          phone: '555-0101',
        },
      ],
      createdAt: new Date('2026-02-01T23:30:00.000Z'),
    });

    const response = await request(app).get(
      '/api/bookings?startDate=2026-02-01&endDate=2026-02-01'
    );

    expect(response.body.bookings.map((booking) => booking.id)).toEqual([
      'JRLATE',
    ]);
  });

  test('combines ticket class and date range', async () => {
    const response = await request(app).get(
      '/api/bookings?ticketClass=premium&startDate=2026-01-10&endDate=2026-01-20&sortOrder=asc'
    );

    expect(response.body.bookings.map((booking) => booking.id)).toEqual([
      'JR010',
      'JR013',
      'JR016',
      'JR019',
    ]);
    expect(response.body.meta.totalItems).toBe(4);
  });

  test('pages through the filtered results and counts only matching bookings', async () => {
    const response = await request(app).get(
      '/api/bookings?ticketClass=premium&page=2&limit=5&sortOrder=asc'
    );

    expect(response.status).toBe(200);
    expect(response.body.bookings).toHaveLength(4);
    expect(response.body.meta).toEqual({
      totalItems: 9,
      totalPages: 2,
      page: 2,
      limit: 5,
      sortBy: 'createdAt',
      sortOrder: 'asc',
      filters: { ticketClass: 'premium' },
    });
  });

  test('returns an empty page when nothing matches', async () => {
    const response = await request(app).get(
      '/api/bookings?startDate=2030-01-01'
    );

    expect(response.status).toBe(200);
    expect(response.body.bookings).toEqual([]);
    expect(response.body.meta.totalItems).toBe(0);
    expect(response.body.meta.totalPages).toBe(0);
    expect(response.body.meta.filters).toEqual({ startDate: '2030-01-01' });
  });
});

describe('GET /api/bookings filter validation', () => {
  test.each([
    [
      'ticketClass=gold',
      'ticketClass must be one of: standard, premium, first',
    ],
    ['ticketClass=', 'ticketClass must be one of: standard, premium, first'],
    [
      'ticketClass=standard&ticketClass=first',
      'ticketClass must be one of: standard, premium, first',
    ],
    ['startDate=01/05/2026', 'startDate must be a date in YYYY-MM-DD format'],
    ['startDate=', 'startDate must be a date in YYYY-MM-DD format'],
    ['endDate=tomorrow', 'endDate must be a date in YYYY-MM-DD format'],
    ['startDate=2026-13-01', 'startDate must be a real calendar date'],
    ['endDate=2026-02-30', 'endDate must be a real calendar date'],
    [
      'startDate=2026-03-01&endDate=2026-02-01',
      'startDate must be on or before endDate',
    ],
  ])('returns 400 for %s', async (query, message) => {
    const response = await request(app).get(`/api/bookings?${query}`);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: message });
  });
});

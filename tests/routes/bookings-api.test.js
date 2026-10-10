// tests/routes/bookings-api.test.js

import { beforeEach, describe, expect, test } from 'vitest';

import bcrypt from 'bcrypt';
import request from 'supertest';

import app from '../../app.js';
import User from '../../src/models/schemas/users.js';
import {
  countBookings,
  createBooking,
  getBookingById,
} from '../../src/models/bookings.js';

const TICKET_CLASSES = ['standard', 'premium', 'first'];

const ADMIN_EMAIL = 'admin@example.com';
const CUSTOMER_EMAIL = 'customer@example.com';
const PASSWORD = 'password-123';

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

/**
 * Creates a user account directly in the test database.
 * The login route stores the role id ('1' customer, '2' admin) in the
 * session, which is what requireApiRole and the users controller compare
 * against.
 */
const createTestUser = async (email, role) => {
  return User.create({
    displayName: email.split('@')[0],
    username: email.split('@')[0],
    email,
    passwordHash: await bcrypt.hash(PASSWORD, 4),
    role,
  });
};

/**
 * Logs in through the real login route and returns an agent that keeps the
 * session cookie, so later requests are treated as this user.
 */
const login = async (email) => {
  const agent = request.agent(app);
  const response = await agent
    .post('/login')
    .send({ email, password: PASSWORD });

  expect(response.status).toBe(302);

  return agent;
};

const loginAdmin = async () => {
  await createTestUser(ADMIN_EMAIL, '2');
  return login(ADMIN_EMAIL);
};

const loginCustomer = async () => {
  await createTestUser(CUSTOMER_EMAIL, '1');
  return login(CUSTOMER_EMAIL);
};

/**
 * A booking that references valid seeded data: schedule 1 runs on the
 * alpine-panorama trip, and 'Monday' is one of its operating days.
 */
const bookingData = (overrides = {}) => ({
  scheduleId: '1',
  tripId: 'alpine-panorama',
  ticketClass: 'standard',
  selectedDay: 'Monday',
  passengers: [
    {
      firstName: 'Yuki',
      lastName: 'Tanaka',
      email: CUSTOMER_EMAIL,
      phone: '555-0100',
    },
  ],
  ...overrides,
});

/**
 * Inserts one booking directly into the test database.
 */
const seedBooking = async (overrides = {}) => {
  const data = bookingData(overrides);

  return createBooking({
    id: overrides.id ?? 'JRTEST01',
    createdAt: overrides.createdAt ?? new Date('2026-01-15T10:00:00.000Z'),
    scheduleId: data.scheduleId,
    tripId: data.tripId,
    ticketClass: data.ticketClass,
    selectedDay: data.selectedDay,
    passengers: data.passengers,
  });
};

describe('GET /api/bookings authorization', () => {
  beforeEach(async () => {
    await seedBooking();
  });

  test('returns 401 for an anonymous request', async () => {
    const response = await request(app).get('/api/bookings');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Authentication required' });
  });

  test('returns 403 for a standard (non-admin) user', async () => {
    const customer = await loginCustomer();

    const response = await customer.get('/api/bookings');

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Forbidden' });
  });

  test('returns the bookings for an administrator', async () => {
    const admin = await loginAdmin();

    const response = await admin.get('/api/bookings');

    expect(response.status).toBe(200);
    expect(response.body.bookings).toHaveLength(1);
    expect(response.body.bookings[0].id).toBe('JRTEST01');
    expect(response.body.meta.totalItems).toBe(1);
  });
});

describe('GET /api/bookings pagination', () => {
  let admin;

  beforeEach(async () => {
    await seedBookings(25);
    admin = await loginAdmin();
  });

  test('returns the first 10 bookings, newest first, with metadata by default', async () => {
    const response = await admin.get('/api/bookings');

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
    const response = await admin.get('/api/bookings?page=2&limit=10');

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
    const response = await admin.get('/api/bookings?page=3');

    expect(response.status).toBe(200);
    expect(response.body.bookings).toHaveLength(5);
    expect(response.body.meta.totalPages).toBe(3);
  });

  test('returns an empty list for a page past the end', async () => {
    const response = await admin.get('/api/bookings?page=99');

    expect(response.status).toBe(200);
    expect(response.body.bookings).toEqual([]);
    expect(response.body.meta.totalItems).toBe(25);
    expect(response.body.meta.page).toBe(99);
  });

  test('honors limit', async () => {
    const response = await admin.get('/api/bookings?limit=5');

    expect(response.body.bookings).toHaveLength(5);
    expect(response.body.meta.limit).toBe(5);
    expect(response.body.meta.totalPages).toBe(5);
  });

  test('sorts ascending by booking date when asked', async () => {
    const response = await admin.get('/api/bookings?sortOrder=asc');

    expect(response.status).toBe(200);
    expect(response.body.bookings[0].id).toBe('JR001');
    expect(response.body.meta.sortOrder).toBe('asc');
  });

  test('sorts by ticket class', async () => {
    const response = await admin.get(
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

    const response = await admin.get('/api/bookings');

    expect(response.status).toBe(200);
    expect(response.body.bookings).toEqual([]);
    expect(response.body.meta.totalItems).toBe(0);
    expect(response.body.meta.totalPages).toBe(0);
  });
});

describe('GET /api/bookings validation', () => {
  let admin;

  beforeEach(async () => {
    admin = await loginAdmin();
  });

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
    const response = await admin.get(`/api/bookings?${query}`);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: message });
  });
});

// With the seed data above, booking i is made on 2026-01-i, and its class is
// first for i = 2, 5, ... (8 bookings), premium for i = 1, 4, ... (9 bookings)
// and standard for i = 3, 6, ... (8 bookings).
describe('GET /api/bookings filtering', () => {
  let admin;

  beforeEach(async () => {
    await seedBookings(25);
    admin = await loginAdmin();
  });

  test('filters by ticket class and reports it in the metadata', async () => {
    const response = await admin.get(
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
    const response = await admin.get(
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
    const response = await admin.get(
      '/api/bookings?endDate=2026-01-05&limit=25'
    );

    expect(response.body.meta.totalItems).toBe(5);
    expect(response.body.bookings.map((booking) => booking.id)).toContain(
      'JR005'
    );
  });

  test('filters by a date range that includes both end days', async () => {
    const response = await admin.get(
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

    const response = await admin.get(
      '/api/bookings?startDate=2026-02-01&endDate=2026-02-01'
    );

    expect(response.body.bookings.map((booking) => booking.id)).toEqual([
      'JRLATE',
    ]);
  });

  test('combines ticket class and date range', async () => {
    const response = await admin.get(
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
    const response = await admin.get(
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
    const response = await admin.get('/api/bookings?startDate=2030-01-01');

    expect(response.status).toBe(200);
    expect(response.body.bookings).toEqual([]);
    expect(response.body.meta.totalItems).toBe(0);
    expect(response.body.meta.totalPages).toBe(0);
    expect(response.body.meta.filters).toEqual({ startDate: '2030-01-01' });
  });
});

describe('GET /api/bookings filter validation', () => {
  let admin;

  beforeEach(async () => {
    admin = await loginAdmin();
  });

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
    const response = await admin.get(`/api/bookings?${query}`);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: message });
  });
});

describe('GET /api/bookings/mine', () => {
  test('returns 401 when not signed in', async () => {
    const response = await request(app).get('/api/bookings/mine');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Authentication required' });
  });

  test("returns only the customer's own bookings, newest first", async () => {
    // One booking for another customer, two for the signed-in customer.
    await seedBooking({
      id: 'JRNOTMINE',
      createdAt: new Date('2026-01-20T10:00:00.000Z'),
      passengers: [
        {
          firstName: 'Someone',
          lastName: 'Else',
          email: 'someone.else@example.com',
          phone: '555-0200',
        },
      ],
    });
    await seedBooking({
      id: 'JRMINEOLD',
      createdAt: new Date('2026-01-10T10:00:00.000Z'),
    });
    await seedBooking({
      id: 'JRMINENEW',
      createdAt: new Date('2026-01-15T10:00:00.000Z'),
    });

    const customer = await loginCustomer();

    const response = await customer.get('/api/bookings/mine');

    expect(response.status).toBe(200);
    expect(response.body.bookings.map((booking) => booking.id)).toEqual([
      'JRMINENEW',
      'JRMINEOLD',
    ]);
    expect(response.body.bookings).toHaveLength(2);
  });

  test('matches the customer email case-insensitively', async () => {
    await seedBooking({
      id: 'JRMIXEDCASE',
      passengers: [
        {
          firstName: 'Yuki',
          lastName: 'Tanaka',
          email: 'Customer@Example.com',
          phone: '555-0100',
        },
      ],
    });

    const customer = await loginCustomer();

    const response = await customer.get('/api/bookings/mine');

    expect(response.status).toBe(200);
    expect(response.body.bookings.map((booking) => booking.id)).toEqual([
      'JRMIXEDCASE',
    ]);
  });
});

describe('GET /api/bookings/:id', () => {
  test('returns 401 when not signed in', async () => {
    await seedBooking();

    const response = await request(app).get('/api/bookings/JRTEST01');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Authentication required' });
  });

  test('lets an administrator read any booking', async () => {
    await seedBooking({
      passengers: [
        {
          firstName: 'Someone',
          lastName: 'Else',
          email: 'someone.else@example.com',
          phone: '555-0200',
        },
      ],
    });

    const admin = await loginAdmin();

    const response = await admin.get('/api/bookings/JRTEST01');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        id: 'JRTEST01',
        scheduleId: '1',
        tripId: 'alpine-panorama',
        ticketClass: 'standard',
        selectedDay: 'Monday',
      })
    );
    expect(response.body.passengers[0].email).toBe('someone.else@example.com');
  });

  test('lets a customer read a booking where they are a passenger', async () => {
    await seedBooking();

    const customer = await loginCustomer();

    const response = await customer.get('/api/bookings/JRTEST01');

    expect(response.status).toBe(200);
    expect(response.body.id).toBe('JRTEST01');
    expect(response.body.passengers[0].email).toBe(CUSTOMER_EMAIL);
  });

  test("hides another customer's booking with 403", async () => {
    await seedBooking({
      passengers: [
        {
          firstName: 'Someone',
          lastName: 'Else',
          email: 'someone.else@example.com',
          phone: '555-0200',
        },
      ],
    });

    const customer = await loginCustomer();

    const response = await customer.get('/api/bookings/JRTEST01');

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Forbidden' });
  });

  test('returns 404 for an unknown booking id', async () => {
    const admin = await loginAdmin();

    const response = await admin.get('/api/bookings/JRNOPE01');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Booking not found' });
  });
});

describe('POST /api/bookings', () => {
  test('returns 401 when not signed in', async () => {
    const response = await request(app)
      .post('/api/bookings')
      .send(bookingData());

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Authentication required' });
    expect(await countBookings()).toBe(0);
  });

  test('creates a booking with valid seeded data and proves it in the database', async () => {
    const customer = await loginCustomer();

    const response = await customer.post('/api/bookings').send(bookingData());

    expect(response.status).toBe(201);
    expect(response.body.id).toMatch(/^JR[A-Z0-9]{8}$/);
    expect(response.body.ticketClass).toBe('standard');
    expect(response.body.tripId).toBe('alpine-panorama');

    // The booking must exist in the temporary database, not just in the reply.
    const stored = await getBookingById(response.body.id);

    expect(stored).not.toBeNull();
    expect(stored.scheduleId).toBe('1');
    expect(stored.passengers[0].email).toBe(CUSTOMER_EMAIL);
    expect(await countBookings()).toBe(1);
  });

  test('lets an administrator create a booking for another passenger', async () => {
    const admin = await loginAdmin();

    const response = await admin.post('/api/bookings').send(
      bookingData({
        passengers: [
          {
            firstName: 'Someone',
            lastName: 'Else',
            email: 'someone.else@example.com',
            phone: '555-0200',
          },
        ],
      })
    );

    expect(response.status).toBe(201);
    expect(await getBookingById(response.body.id)).not.toBeNull();
  });

  test('returns 400 and creates nothing when a required field is missing', async () => {
    const customer = await loginCustomer();

    const { passengers, ...withoutPassengers } = bookingData();
    const response = await customer
      .post('/api/bookings')
      .send(withoutPassengers);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error:
        'scheduleId, tripId, ticketClass, selectedDay, and passengers are required',
    });
    expect(await countBookings()).toBe(0);
  });

  test('returns 400 for an unknown ticket class', async () => {
    const customer = await loginCustomer();

    const response = await customer
      .post('/api/bookings')
      .send(bookingData({ ticketClass: 'gold' }));

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'ticketClass must be one of: standard, premium, first',
    });
    expect(await countBookings()).toBe(0);
  });

  test('returns 400 when the passenger list is empty', async () => {
    const customer = await loginCustomer();

    const response = await customer
      .post('/api/bookings')
      .send(bookingData({ passengers: [] }));

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'passengers must be a non-empty array',
    });
    expect(await countBookings()).toBe(0);
  });

  test('returns 400 when a passenger is missing a field', async () => {
    const customer = await loginCustomer();

    const response = await customer.post('/api/bookings').send(
      bookingData({
        passengers: [{ firstName: 'Yuki', lastName: 'Tanaka' }],
      })
    );

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'each passenger requires firstName, lastName, email, and phone',
    });
    expect(await countBookings()).toBe(0);
  });

  test('returns 400 for a schedule that does not exist', async () => {
    const customer = await loginCustomer();

    const response = await customer
      .post('/api/bookings')
      .send(bookingData({ scheduleId: '999' }));

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'scheduleId does not match a known schedule',
    });
    expect(await countBookings()).toBe(0);
  });

  test('returns 400 when the trip does not match the schedule', async () => {
    const customer = await loginCustomer();

    const response = await customer
      .post('/api/bookings')
      .send(bookingData({ tripId: 'coastal-breeze' }));

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'tripId does not match the schedule',
    });
    expect(await countBookings()).toBe(0);
  });
});

describe('PUT /api/bookings/:id', () => {
  test('returns 401 when not signed in', async () => {
    await seedBooking();

    const response = await request(app)
      .put('/api/bookings/JRTEST01')
      .send({ ticketClass: 'first' });

    expect(response.status).toBe(401);
    expect(await getBookingById('JRTEST01')).not.toBeNull();
  });

  test('lets an administrator change any booking and proves the change in the database', async () => {
    await seedBooking();

    const admin = await loginAdmin();

    const response = await admin
      .put('/api/bookings/JRTEST01')
      .send({ ticketClass: 'first' });

    expect(response.status).toBe(200);
    expect(response.body.id).toBe('JRTEST01');
    expect(response.body.ticketClass).toBe('first');

    const stored = await getBookingById('JRTEST01');
    expect(stored.ticketClass).toBe('first');
  });

  test('lets a customer update their own booking', async () => {
    await seedBooking();

    const customer = await loginCustomer();

    const response = await customer
      .put('/api/bookings/JRTEST01')
      .send({ selectedDay: 'Wednesday' });

    expect(response.status).toBe(200);
    expect(response.body.selectedDay).toBe('Wednesday');

    const stored = await getBookingById('JRTEST01');
    expect(stored.selectedDay).toBe('Wednesday');
  });

  test("refuses to update another customer's booking and leaves it unchanged", async () => {
    await seedBooking({
      passengers: [
        {
          firstName: 'Someone',
          lastName: 'Else',
          email: 'someone.else@example.com',
          phone: '555-0200',
        },
      ],
    });

    const customer = await loginCustomer();

    const response = await customer
      .put('/api/bookings/JRTEST01')
      .send({ ticketClass: 'first' });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Forbidden' });

    const stored = await getBookingById('JRTEST01');
    expect(stored.ticketClass).toBe('standard');
  });

  test('returns 404 for an unknown booking id', async () => {
    const admin = await loginAdmin();

    const response = await admin
      .put('/api/bookings/JRNOPE01')
      .send({ ticketClass: 'first' });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Booking not found' });
  });

  test('returns 400 for a field that cannot be updated', async () => {
    await seedBooking();

    const admin = await loginAdmin();

    const response = await admin
      .put('/api/bookings/JRTEST01')
      .send({ id: 'JRCHANGED' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error:
        'Only scheduleId, tripId, ticketClass, selectedDay, and passengers can be updated',
    });
    expect(await getBookingById('JRTEST01')).not.toBeNull();
  });

  test('returns 400 for an invalid ticket class value', async () => {
    await seedBooking();

    const admin = await loginAdmin();

    const response = await admin
      .put('/api/bookings/JRTEST01')
      .send({ ticketClass: 'gold' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'ticketClass must be one of: standard, premium, first',
    });

    const stored = await getBookingById('JRTEST01');
    expect(stored.ticketClass).toBe('standard');
  });
});

describe('DELETE /api/bookings/:id', () => {
  test('returns 401 when not signed in', async () => {
    await seedBooking();

    const response = await request(app).delete('/api/bookings/JRTEST01');

    expect(response.status).toBe(401);
    expect(await getBookingById('JRTEST01')).not.toBeNull();
  });

  test('lets a customer delete their own booking and proves it is gone', async () => {
    await seedBooking();

    const customer = await loginCustomer();

    const response = await customer.delete('/api/bookings/JRTEST01');

    expect(response.status).toBe(200);
    expect(response.body.id).toBe('JRTEST01');

    expect(await getBookingById('JRTEST01')).toBeNull();
    expect(await countBookings()).toBe(0);
  });

  test('lets an administrator delete any booking', async () => {
    await seedBooking({
      passengers: [
        {
          firstName: 'Someone',
          lastName: 'Else',
          email: 'someone.else@example.com',
          phone: '555-0200',
        },
      ],
    });

    const admin = await loginAdmin();

    const response = await admin.delete('/api/bookings/JRTEST01');

    expect(response.status).toBe(200);
    expect(await getBookingById('JRTEST01')).toBeNull();
  });

  test("refuses to delete another customer's booking", async () => {
    await seedBooking({
      passengers: [
        {
          firstName: 'Someone',
          lastName: 'Else',
          email: 'someone.else@example.com',
          phone: '555-0200',
        },
      ],
    });

    const customer = await loginCustomer();

    const response = await customer.delete('/api/bookings/JRTEST01');

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Forbidden' });
    expect(await getBookingById('JRTEST01')).not.toBeNull();
  });

  test('returns 404 for an unknown booking id', async () => {
    const admin = await loginAdmin();

    const response = await admin.delete('/api/bookings/JRNOPE01');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Booking not found' });
  });
});
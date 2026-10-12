// tests/routes/trips-write.test.js

import { beforeEach, describe, expect, test } from 'vitest';

import request from 'supertest';

import app from '../../app.js';
import Trip from '../../src/models/schemas/trips.js';
import User from '../../src/models/schemas/users.js';
import { createUser } from '../../src/models/users.js';

// Test-only accounts. These passwords are never used outside the test database.
const ADMIN = {
    displayName: 'Test Admin',
    username: 'test-admin',
    email: 'admin@test.local',
    password: 'admin-test-password',
};

const CUSTOMER = {
    displayName: 'Test Customer',
    username: 'test-customer',
    email: 'customer@test.local',
    password: 'customer-test-password',
};

// Matches the seeded roles: '1' is customer, '2' is admin
const ADMIN_ROLE_ID = '2';

const NEW_TRIP = {
    id: 'test-scenic-line',
    name: 'Test Scenic Line',
    description: 'A trip created by the automated tests.',
    region: 'central',
    startStation: 'nagoya',
    endStation: 'toyama',
    duration: '2 hours',
    distance: 90,
    bestSeason: 'spring',
};

// createUser always gives the customer role, so the admin is promoted afterward
beforeEach(async () => {
    await createUser(ADMIN);
    await User.updateOne({ email: ADMIN.email }, { role: ADMIN_ROLE_ID });
    await createUser(CUSTOMER);
});

// Logs in through the real login route; the agent keeps the session cookie
async function loginAs(user) {
    const agent = request.agent(app);

    const response = await agent
        .post('/login')
        .type('form')
        .send({ email: user.email, password: user.password });

    expect(response.status).toBe(302);

    return agent;
}

const findTrip = (id) => Trip.findOne({ id }).lean();

describe('POST /api/trips', () => {
    test('creates a trip when logged in as an admin', async () => {
        const admin = await loginAs(ADMIN);

        const response = await admin.post('/api/trips').send(NEW_TRIP);

        expect(response.status).toBe(201);
        expect(response.body).toEqual(expect.objectContaining(NEW_TRIP));

        const saved = await findTrip(NEW_TRIP.id);
        expect(saved).toEqual(expect.objectContaining(NEW_TRIP));
    });

    test('returns 400 and saves nothing when a required field is missing', async () => {
        const admin = await loginAs(ADMIN);

        const response = await admin
            .post('/api/trips')
            .send({ id: 'incomplete-trip', name: 'Incomplete Trip' });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('is required');
        expect(await findTrip('incomplete-trip')).toBeNull();
    });

    test('returns 400 and leaves the existing trip unchanged when the id already exists', async () => {
        const admin = await loginAs(ADMIN);

        const response = await admin
            .post('/api/trips')
            .send({ ...NEW_TRIP, id: 'alpine-panorama' });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: 'A trip with id "alpine-panorama" already exists',
        });

        const existing = await findTrip('alpine-panorama');
        expect(existing.name).toBe('Alpine Panorama Express');
        expect(await Trip.countDocuments()).toBe(6);
    });

    test('returns 401 and saves nothing when not logged in', async () => {
        const response = await request(app).post('/api/trips').send(NEW_TRIP);

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ error: 'Authentication required' });
        expect(await findTrip(NEW_TRIP.id)).toBeNull();
    });

    test('returns 403 and saves nothing for a customer', async () => {
        const customer = await loginAs(CUSTOMER);

        const response = await customer.post('/api/trips').send(NEW_TRIP);

        expect(response.status).toBe(403);
        expect(response.body).toEqual({ error: 'Forbidden' });
        expect(await findTrip(NEW_TRIP.id)).toBeNull();
    });
});

describe('PUT /api/trips/:id', () => {
    const changes = { name: 'Alpine Panorama Deluxe', distance: 200 };

    test('updates a trip when logged in as an admin', async () => {
        const admin = await loginAs(ADMIN);

        const response = await admin.put('/api/trips/alpine-panorama').send(changes);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(
            expect.objectContaining({ id: 'alpine-panorama', ...changes })
        );

        const saved = await findTrip('alpine-panorama');
        expect(saved).toEqual(expect.objectContaining(changes));
    });

    test('returns 400 and leaves the trip unchanged for an invalid value', async () => {
        const admin = await loginAs(ADMIN);

        const response = await admin
            .put('/api/trips/alpine-panorama')
            .send({ region: 'moon' });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('region');
        expect((await findTrip('alpine-panorama')).region).toBe('central');
    });

    test('returns 404 when the trip does not exist', async () => {
        const admin = await loginAs(ADMIN);

        const response = await admin.put('/api/trips/does-not-exist').send(changes);

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'Trip not found' });
    });

    test('returns 401 and leaves the trip unchanged when not logged in', async () => {
        const response = await request(app)
            .put('/api/trips/alpine-panorama')
            .send(changes);

        expect(response.status).toBe(401);
        expect((await findTrip('alpine-panorama')).name).toBe('Alpine Panorama Express');
    });

    test('returns 403 and leaves the trip unchanged for a customer', async () => {
        const customer = await loginAs(CUSTOMER);

        const response = await customer.put('/api/trips/alpine-panorama').send(changes);

        expect(response.status).toBe(403);
        expect((await findTrip('alpine-panorama')).name).toBe('Alpine Panorama Express');
    });
});

describe('DELETE /api/trips/:id', () => {
    test('deletes a trip when logged in as an admin', async () => {
        const admin = await loginAs(ADMIN);

        const response = await admin.delete('/api/trips/alpine-panorama');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ message: 'Trip deleted successfully' });
        expect(await findTrip('alpine-panorama')).toBeNull();
        expect(await Trip.countDocuments()).toBe(5);
    });

    test('returns 404 and deletes nothing when the trip does not exist', async () => {
        const admin = await loginAs(ADMIN);

        const response = await admin.delete('/api/trips/does-not-exist');

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'Trip not found' });
        expect(await Trip.countDocuments()).toBe(6);
    });

    test('returns 401 and keeps the trip when not logged in', async () => {
        const response = await request(app).delete('/api/trips/alpine-panorama');

        expect(response.status).toBe(401);
        expect(await findTrip('alpine-panorama')).not.toBeNull();
    });

    test('returns 403 and keeps the trip for a customer', async () => {
        const customer = await loginAs(CUSTOMER);

        const response = await customer.delete('/api/trips/alpine-panorama');

        expect(response.status).toBe(403);
        expect(await findTrip('alpine-panorama')).not.toBeNull();
    });
});
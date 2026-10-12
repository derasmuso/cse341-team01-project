import { describe, expect, test } from 'vitest';

import request from 'supertest';

import app from '../../app.js';

describe('GET /api/trips', () => {
    test('returns 200 with a JSON response', async () => {
        const response = await request(app).get('/api/trips');

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toContain('application/json');
    });

    test('returns all 6 seeded trips', async () => {
        const response = await request(app).get('/api/trips');

        expect(response.body.trips).toHaveLength(6);
        expect(response.body.totalTrips).toBe(6);
    });

    test('includes the important fields on every trip', async () => {
        const response = await request(app).get('/api/trips');

        for (const trip of response.body.trips) {
            expect(trip).toHaveProperty('id');
            expect(trip).toHaveProperty('name');
            expect(trip).toHaveProperty('description');
            expect(trip).toHaveProperty('region');
            expect(trip).toHaveProperty('bestSeason');
        }
    });

    test('includes the seeded alpine-panorama trip', async () => {
        const response = await request(app).get('/api/trips');

        const trip = response.body.trips.find((t) => t.id === 'alpine-panorama');

        expect(trip).toBeDefined();
        expect(trip.name).toBe('Alpine Panorama Express');
    });
});

describe('GET /api/trips/:id', () => {
    test('returns the seeded trip for a known id', async () => {
        const response = await request(app).get('/api/trips/alpine-panorama');

        expect(response.status).toBe(200);
        expect(response.body).toEqual(
            expect.objectContaining({
                id: 'alpine-panorama',
                name: 'Alpine Panorama Express',
                region: 'central',
                bestSeason: 'autumn',
                distance: 180,
            })
        );
    });

    test('returns 404 for a trip id that does not exist', async () => {
        const response = await request(app).get('/api/trips/does-not-exist');

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'Trip not found' });
    });
});
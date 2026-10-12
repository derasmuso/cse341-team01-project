import { describe, expect, test } from 'vitest';

import request from 'supertest';

import app from '../../app.js';

const ids = (response) => response.body.trips.map((trip) => trip.id); 

// API trips
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

// API trips by ID
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

// API trips pagination
describe('GET /api/trips pagination', () => {
    test('returns the first page sorted by name with default metadata', async () => {
        const response = await request(app).get('/api/trips');

        expect(response.status).toBe(200);
        expect(ids(response)).toEqual([
            'alpine-panorama',
            'coastal-breeze',
            'gorge-explorer',
            'romantic-gorge',
            'sakura-valley',
            'winter-wetlands',
        ]);
        expect(response.body).toEqual(
            expect.objectContaining({ page: 1, limit: 10, totalTrips: 6, totalPages: 1 })
        );
    });

    test('returns the requested page and limit', async () => {
        const response = await request(app).get('/api/trips?page=2&limit=2');

        expect(response.status).toBe(200);
        expect(ids(response)).toEqual(['gorge-explorer', 'romantic-gorge']);
        expect(response.body).toEqual(
            expect.objectContaining({ page: 2, limit: 2, totalTrips: 6, totalPages: 3 })
        );
    });

    test('returns fewer trips than the limit on a partial last page', async () => {
        const response = await request(app).get('/api/trips?limit=4&page=2');

        expect(response.status).toBe(200);
        expect(ids(response)).toEqual(['sakura-valley', 'winter-wetlands']);
        expect(response.body).toEqual(
            expect.objectContaining({ page: 2, limit: 4, totalTrips: 6, totalPages: 2 })
        );
    });

    test('never repeats a trip across pages', async () => {
        const allIds = [];

        for (const page of [1, 2, 3]) {
            const response = await request(app).get(`/api/trips?page=${page}&limit=2`);
            allIds.push(...ids(response));
        }

        expect(new Set(allIds).size).toBe(6);
    });

    test('returns an empty array for a page past the end', async () => {
        const response = await request(app).get('/api/trips?page=99');

        expect(response.status).toBe(200);
        expect(response.body.trips).toEqual([]);
        expect(response.body.totalTrips).toBe(6);
    });

    test.each(['page=0', 'page=abc', 'limit=0', 'limit=51'])(
        'returns 400 for %s',
        async (query) => {
            const response = await request(app).get(`/api/trips?${query}`);

            expect(response.status).toBe(400);
        }
    );
});

// API trips filter
describe('GET /api/trips filters', () => {
    test('region returns only trips in that region', async () => {
        const response = await request(app).get('/api/trips?region=central');

        expect(response.status).toBe(200);
        expect(ids(response)).toEqual(['alpine-panorama', 'gorge-explorer']);
        expect(response.body.totalTrips).toBe(2);
    });

    test('season returns only trips with that best season', async () => {
        const response = await request(app).get('/api/trips?season=autumn');

        expect(response.status).toBe(200);
        expect(ids(response)).toEqual(['alpine-panorama', 'gorge-explorer', 'romantic-gorge']);
        expect(response.body.totalTrips).toBe(3);
    });

    test('season returns a single match', async () => {
        const response = await request(app).get('/api/trips?season=winter');

        expect(response.status).toBe(200);
        expect(ids(response)).toEqual(['winter-wetlands']);
        expect(response.body.totalTrips).toBe(1);
    });

    test('search matches names in any letter case', async () => {
        const response = await request(app).get('/api/trips?search=COAST');

        expect(response.status).toBe(200);
        expect(ids(response)).toEqual(['coastal-breeze']);
        expect(response.body.totalTrips).toBe(1);
    });

    test('search matches descriptions', async () => {
        const response = await request(app).get('/api/trips?search=cranes');

        expect(response.status).toBe(200);
        expect(ids(response)).toEqual(['winter-wetlands']);
        expect(response.body.totalTrips).toBe(1);
    });

    test('region, season, and search combine with AND', async () => {
        const response = await request(app).get(
            '/api/trips?region=central&season=autumn&search=alps'
        );

        expect(response.status).toBe(200);
        expect(ids(response)).toEqual(['alpine-panorama', 'gorge-explorer']);
        expect(response.body.totalTrips).toBe(2);
    });

    test('a filter excludes search matches outside it', async () => {
        const response = await request(app).get('/api/trips?region=kansai&search=mountain');

        expect(response.status).toBe(200);
        expect(ids(response)).toEqual(['sakura-valley']);
        expect(response.body.totalTrips).toBe(1);
    });

    test('filtered results are paginated with filtered totals', async () => {
        const response = await request(app).get('/api/trips?season=autumn&limit=2&page=2');

        expect(response.status).toBe(200);
        expect(ids(response)).toEqual(['romantic-gorge']);
        expect(response.body).toEqual(
            expect.objectContaining({ page: 2, limit: 2, totalTrips: 3, totalPages: 2 })
        );
    });

    test('no matches returns 200 with an empty array', async () => {
        const response = await request(app).get('/api/trips?search=zzz');

        expect(response.status).toBe(200);
        expect(response.body).toEqual(
            expect.objectContaining({ trips: [], totalTrips: 0, totalPages: 0 })
        );
    });

    test.each(['(', '.*'])('treats "%s" as plain text', async (text) => {
        const response = await request(app).get(
            `/api/trips?search=${encodeURIComponent(text)}`
        );

        expect(response.status).toBe(200);
        expect(response.body.totalTrips).toBe(0);
    });

    test.each(['region=moon', 'season=monsoon'])('returns 400 for %s', async (query) => {
        const response = await request(app).get(`/api/trips?${query}`);

        expect(response.status).toBe(400);
    });
});
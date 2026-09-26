import { describe, expect, test } from 'vitest';

import request from 'supertest';

import app from '../../app.js';

describe('GET /api/ticket-classes', () => {
    test('returns a successful JSON response', async () => {
        const response = await request(app)
            .get('/api/ticket-classes');

        console.log(response.body);

        expect(response.status).toBe(200);
        expect(response.headers['content-type'])
            .toContain('application/json');
    });

    test('returns the expected ticket classes', async () => {
        const response = await request(app)
            .get('/api/ticket-classes');

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(3);

        expect(response.body).toEqual(
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
});

describe('GET /api/ticket-classes?day={day}', () => {
    test('returns ticket classes available for the requested day', async () => {
        const response = await request(app)
            .get('/api/ticket-classes?day=monday');

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(2);

        expect(response.body).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    class: 'premium'
                }),
                expect.objectContaining({
                    class: 'first'
                })
            ])
        );
    });

    test('processes the day query parameter case-insensitively', async () => {
        const response = await request(app)
            .get('/api/ticket-classes?day=Tuesday');

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(3);

        expect(response.body).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    class: 'standard'
                }),
                expect.objectContaining({
                    class: 'premium'
                }),
                expect.objectContaining({
                    class: 'first'
                })
            ])
        );
    });

    test('returns an empty array when no classes are available', async () => {
        const response = await request(app)
            .get('/api/ticket-classes?day=sunday');

        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    });

    test('returns 400 for an invalid day', async () => {
        const response = await request(app)
            .get('/api/ticket-classes?day=invalid');

        expect(response.status).toBe(400);

        expect(response.body).toEqual({
            message: 'Invalid day'
        });
    });

    test('returns 400 when the day query parameter is empty', async () => {
        const response = await request(app)
            .get('/api/ticket-classes?day=');

        expect(response.status).toBe(400);

        expect(response.body).toEqual({
            message: 'Invalid day'
        });
    });
});
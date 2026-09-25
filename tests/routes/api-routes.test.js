import { describe, expect, test } from 'vitest';

import request from 'supertest';

import app from '../../app.js';

import { getDb } from '../../src/db/connect.js';

describe('GET /api/ticket-classes', () => {
    test('returns a successful JSON response', async () => {
        await getDb().collection('ticketClasses').insertOne({
            class: 'standard',
            pricePerKm: 80,
            amenities: ['Comfortable seats'],
            description: 'Standard class',
            availableDays: ['tuesday', 'thursday']
        });

        const response = await request(app)
            .get('/api/ticket-classes');

        expect(response.status).toBe(200);
        expect(response.headers['content-type'])
            .toContain('application/json');
    });

    test('returns the expected ticket classes', async () => {
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

        const response = await request(app)
            .get('/api/ticket-classes');

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(2);

        expect(response.body).toEqual(
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
});

describe('GET /api/ticket-classes?day={day}', () => {
    test('returns ticket classes available for the requested day', async () => {
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

        const response = await request(app)
            .get('/api/ticket-classes?day=tuesday');

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);

        expect(response.body[0]).toEqual(
            expect.objectContaining({
                class: 'standard'
            })
        );
    });

    test('processes the day query parameter case-insensitively', async () => {
        await getDb().collection('ticketClasses').insertOne({
            class: 'standard',
            pricePerKm: 80,
            amenities: ['Comfortable seats'],
            description: 'Standard class',
            availableDays: ['tuesday']
        });

        const response = await request(app)
            .get('/api/ticket-classes?day=Tuesday');

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);

        expect(response.body[0].class).toBe('standard');
    });

    test('returns an empty array when no classes are available', async () => {
        await getDb().collection('ticketClasses').insertOne({
            class: 'standard',
            pricePerKm: 80,
            amenities: ['Comfortable seats'],
            description: 'Standard class',
            availableDays: ['tuesday']
        });

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
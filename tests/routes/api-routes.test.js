import { describe, expect, test } from 'vitest';

import request from 'supertest';

import app from '../../app.js';

describe('GET /api/ticket-classes', () => {
  test('returns a successful JSON response', async () => {
    const response = await request(app).get('/api/ticket-classes');

    console.log(response.body);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
  });

  test('returns the expected ticket classes', async () => {
    const response = await request(app).get('/api/ticket-classes');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(3);

    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          class: 'standard',
          pricePerKm: 80,
        }),
        expect.objectContaining({
          class: 'premium',
          pricePerKm: 150,
        }),
        expect.objectContaining({
          class: 'first',
          pricePerKm: 250,
        }),
      ])
    );
  });
});

describe('GET /api/ticket-classes?day={day}', () => {
  test('returns ticket classes available for the requested day', async () => {
    const response = await request(app).get('/api/ticket-classes?day=monday');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);

    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          class: 'premium',
        }),
        expect.objectContaining({
          class: 'first',
        }),
      ])
    );
  });

  test('processes the day query parameter case-insensitively', async () => {
    const response = await request(app).get('/api/ticket-classes?day=Tuesday');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(3);

    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          class: 'standard',
        }),
        expect.objectContaining({
          class: 'premium',
        }),
        expect.objectContaining({
          class: 'first',
        }),
      ])
    );
  });

  test('returns the first class when Sunday is requested', async () => {
    const response = await request(app).get('/api/ticket-classes?day=sunday');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);

    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          class: 'first',
          pricePerKm: 250,
        }),
      ])
    );
  });

  test('returns 400 for an invalid day', async () => {
    const response = await request(app).get('/api/ticket-classes?day=invalid');

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      message: 'Invalid day',
    });
  });

  test('returns 400 when the day query parameter is empty', async () => {
    const response = await request(app).get('/api/ticket-classes?day=');

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      message: 'Invalid day',
    });
  });
});

describe('GET /api/trips', () => {
  test('returns the first page with default metadata', async () => {
    const response = await request(app).get('/api/trips');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({ page: 1, limit: 10, totalTrips: 6, totalPages: 1 })
    );
    expect(response.body.trips).toHaveLength(6);
  });

  test('returns the requested page and limit', async () => {
    const response = await request(app).get('/api/trips?page=2&limit=2');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({ page: 2, limit: 2, totalTrips: 6, totalPages: 3 })
    );
    expect(response.body.trips).toHaveLength(2);
  });

  test('never repeats a trip across pages', async () => {
    const ids = [];

    for (const page of [1, 2, 3]) {
      const response = await request(app).get(`/api/trips?page=${page}&limit=2`);
      ids.push(...response.body.trips.map((trip) => trip.id));
    }

    expect(new Set(ids).size).toBe(6);
  });

  test('returns an empty array for a page past the end', async () => {
    const response = await request(app).get('/api/trips?page=99');

    expect(response.status).toBe(200);
    expect(response.body.trips).toEqual([]);
  });

  test.each(['page=0', 'page=abc', 'limit=0', 'limit=51'])(
    'returns 400 for %s',
    async (query) => {
      const response = await request(app).get(`/api/trips?${query}`);

      expect(response.status).toBe(400);
    }
  );
});

describe('GET /api/trips filters', () => {
  const ids = (response) => response.body.trips.map((trip) => trip.id);

  test('region returns only trips in that region', async () => {
    const response = await request(app).get('/api/trips?region=central');

    expect(response.status).toBe(200);
    expect(response.body.totalTrips).toBe(2);
    expect(response.body.trips.every((trip) => trip.region === 'central')).toBe(true);
  });

  test('season returns only trips with that best season', async () => {
    const response = await request(app).get('/api/trips?season=winter');

    expect(response.status).toBe(200);
    expect(ids(response)).toEqual(['winter-wetlands']);
  });

  test('search matches names in any letter case', async () => {
    const response = await request(app).get('/api/trips?search=COAST');

    expect(response.status).toBe(200);
    expect(ids(response)).toEqual(['coastal-breeze']);
  });

  test('search matches descriptions', async () => {
    const response = await request(app).get('/api/trips?search=cranes');

    expect(response.status).toBe(200);
    expect(ids(response)).toEqual(['winter-wetlands']);
  });

  test('region, season, and search combine with AND', async () => {
    const response = await request(app).get(
      '/api/trips?region=central&season=autumn&search=alps'
    );

    expect(response.status).toBe(200);
    expect(ids(response)).toEqual(['alpine-panorama', 'gorge-explorer']);
  });

  test('a filter excludes search matches outside it', async () => {
    const response = await request(app).get('/api/trips?region=kansai&search=mountain');

    expect(response.status).toBe(200);
    expect(ids(response)).toEqual(['sakura-valley']);
  });

  test('filtered results are paginated with filtered totals', async () => {
    const response = await request(app).get('/api/trips?season=autumn&limit=2&page=2');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({ page: 2, limit: 2, totalTrips: 3, totalPages: 2 })
    );
    expect(response.body.trips).toHaveLength(1);
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

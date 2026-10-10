
import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../../app.js';

describe('GET /api/stations', () => {
  test('returns all stations successfully', async () => {
    const response = await request(app).get('/api/stations');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(Array.isArray(response.body.stations)).toBe(true);
    expect(response.body.stations.length).toBeGreaterThan(0);
  });

  test('includes the expected station fields', async () => {
    const response = await request(app).get('/api/stations');

    expect(response.status).toBe(200);
    expect(response.body.stations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'nagoya',
          name: 'Nagoya Station',
          prefecture: 'Aichi',
          region: 'central',
        }),
      ]),
    );
  });
});

describe('GET /api/stations/:id', () => {
  test('returns one station by its ID', async () => {
    const response = await request(app).get('/api/stations/nagoya');

    expect(response.status).toBe(200);
    expect(response.body.station).toEqual(
      expect.objectContaining({
        id: 'nagoya',
        name: 'Nagoya Station',
        prefecture: 'Aichi',
      }),
    );
  });

  test('returns 404 for an unknown station', async () => {
    const response = await request(app).get(
      '/api/stations/not-a-station',
    );

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Station not found');
  });
})
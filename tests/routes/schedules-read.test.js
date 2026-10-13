import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../../app.js';

describe('GET /api/trips/:id/schedules — schedule reads', () => {
  test('returns all schedules for a known trip', async () => {
    const response = await request(app).get(
      '/api/trips/alpine-panorama/schedules'
    );

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toHaveLength(2);

    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          tripId: 'alpine-panorama',
          departureTime: '08:30',
          arrivalTime: '13:00',
          status: true,
        }),
        expect.objectContaining({
          id: 2,
          tripId: 'alpine-panorama',
          departureTime: '13:15',
          arrivalTime: '17:45',
          status: true,
        }),
      ])
    );
  });

  test('returns an empty array for a trip id that does not exist', async () => {
    const response = await request(app).get(
      '/api/trips/not-a-real-trip/schedules'
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
});
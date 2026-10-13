import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../../app.js';

describe('GET /api/trips/:id/schedules — trip relationship', () => {
  test('every returned schedule references the requested trip id', async () => {
    const response = await request(app).get(
      '/api/trips/coastal-breeze/schedules'
    );

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body.every((s) => s.tripId === 'coastal-breeze')).toBe(
      true
    );
  });
});

describe('GET /api/trips/:id/schedules?month={month}', () => {
  test('returns schedules when the month is in the trip operating months', async () => {
    const response = await request(app).get(
      '/api/trips/alpine-panorama/schedules?month=6'
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body.every((s) => s.tripId === 'alpine-panorama')).toBe(
      true
    );
  });

  test('returns an empty array when the month is not an operating month', async () => {
    const response = await request(app).get(
      '/api/trips/winter-wetlands/schedules?month=6'
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  test('returns an empty array for a trip id that does not exist', async () => {
    const response = await request(app).get(
      '/api/trips/not-a-real-trip/schedules?month=6'
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  test.each(['0', '13', 'abc', '-1', '1.5'])(
    'returns 400 for an invalid month value of "%s"',
    async (month) => {
      const response = await request(app).get(
        `/api/trips/alpine-panorama/schedules?month=${month}`
      );

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Invalid month. Month must be an integer between 1 and 12.',
      });
    }
  );
});
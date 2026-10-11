
import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import { getDb } from '../../src/db/connect.js';

describe('Trip and station relationships', () => {
  test('known trip references real origin and destination stations', async () => {
    const db = getDb();

    const trip = await db.collection('trips').findOne({
      id: 'alpine-panorama',
    });

    expect(trip).not.toBeNull();

    const [origin, destination] = await Promise.all([
      db.collection('stations').findOne({ id: trip.startStation }),
      db.collection('stations').findOne({ id: trip.endStation }),
    ]);

    expect(origin).not.toBeNull();
    expect(destination).not.toBeNull();
    expect(origin.id).toBe('nagoya');
    expect(destination.id).toBe('toyama');
  });

  test('trip API returns station references connected to the selected trip', async () => {
    const response = await request(app).get('/api/trips/alpine-panorama');

    expect(response.status).toBe(200);
    expect(response.body.id).toBe('alpine-panorama');
    expect(response.body.startStation).toBe('nagoya');
    expect(response.body.endStation).toBe('toyama');

    const db = getDb();

    const [origin, destination] = await Promise.all([
      db.collection('stations').findOne({
        id: response.body.startStation,
      }),
      db.collection('stations').findOne({
        id: response.body.endStation,
      }),
    ]);

    expect(origin).toEqual(
      expect.objectContaining({
        id: 'nagoya',
        name: 'Nagoya Station',
      }),
    );

    expect(destination).toEqual(
      expect.objectContaining({
        id: 'toyama',
        name: 'Toyama Station',
      }),
    );
  });
});
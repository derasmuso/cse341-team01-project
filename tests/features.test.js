import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { getDb } from '../src/db/connect.js';

describe('trip, schedule, station, and ticket-class APIs', () => {
  test('returns trips and a trip by its public id', async () => {
    const listResponse = await request(app).get('/api/trips');
    const detailResponse = await request(app).get('/api/trips/alpine-panorama');

    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'alpine-panorama' })
    ]));
    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.name).toBe('Alpine Panorama Express');
    expect((await request(app).get('/api/trips/not-a-trip')).status).toBe(404);
  });

  test('filters schedules by trip and validates month values', async () => {
    const allSchedules = await request(app).get('/api/trips/alpine-panorama/schedules');
    const monthSchedules = await request(app).get('/api/trips/alpine-panorama/schedules?month=4');
    const invalidMonth = await request(app).get('/api/trips/alpine-panorama/schedules?month=13');

    expect(allSchedules.status).toBe(200);
    expect(allSchedules.body.length).toBeGreaterThan(0);
    expect(allSchedules.body.every((schedule) => schedule.tripId === 'alpine-panorama')).toBe(true);
    expect(monthSchedules.status).toBe(200);
    expect(invalidMonth.status).toBe(400);
  });

  test('returns station details and ticket-class data', async () => {
    const station = await request(app).get('/api/stations/nagoya');
    const classes = await request(app).get('/api/ticket-classes');
    const classesForDay = await request(app).get('/api/ticket-classes?day=monday');
    const weekendClasses = await request(app).get('/api/ticket-classes?day=saturday');
    const invalidDay = await request(app).get('/api/ticket-classes?day=funday');

    expect(station.status).toBe(200);
    expect(station.body).toMatchObject({ id: 'nagoya', prefecture: 'Aichi' });
    expect(classes.status).toBe(200);
    expect(classes.body).toHaveLength(3);
    expect(classesForDay.status).toBe(200);
    expect(classesForDay.body.map((ticketClass) => ticketClass.class)).toEqual(['standard', 'premium']);
    expect(weekendClasses.body.map((ticketClass) => ticketClass.class)).toEqual(['standard', 'first']);
    expect(invalidDay.status).toBe(400);
  });
});

describe('booking routes', () => {
  test('stores a valid booking in the bookings collection', async () => {
    const response = await request(app)
      .post('/trips/book')
      .type('form')
      .send({
        scheduleId: '1',
        tripId: 'alpine-panorama',
        ticketClass: 'standard',
        selectedDay: 'monday',
        'passengers[0][firstName]': 'Mika',
        'passengers[0][lastName]': 'Sato',
        'passengers[0][email]': 'mika@example.com',
        'passengers[0][phone]': '+81 90-0000-0000'
      });

    expect(response.status).toBe(302);
    expect(response.headers.location).toMatch(/^\/trips\/confirmation\/JR/);
    const savedBooking = await getDb().collection('bookings').findOne({});
    expect(savedBooking).toMatchObject({
      tripId: 'alpine-panorama',
      ticketClass: 'standard',
      selectedDay: 'monday'
    });
    expect(savedBooking.passengers).toHaveLength(1);
  });

  test('protects booking records and rejects invalid booking submissions', async () => {
    const apiResponse = await request(app).get('/api/bookings');
    const formResponse = await request(app).post('/trips/book').type('form').send({});

    expect(apiResponse.status).toBe(401);
    expect(formResponse.status).toBe(400);
  });
});

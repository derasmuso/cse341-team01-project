import { describe, expect, test, vi } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import { requireApiRole, requirePageRole } from '../../src/middleware/auth.js';

const createResponse = () => {
  const response = {};
  response.status = vi.fn().mockReturnValue(response);
  response.json = vi.fn().mockReturnValue(response);
  response.redirect = vi.fn().mockReturnValue(response);
  response.render = vi.fn().mockReturnValue(response);
  return response;
};

describe('Bookings admin authorization', () => {
  test('redirects signed-out visitors from the admin page', async () => {
    const response = await request(app).get('/bookings-admin');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/login');
  });

  test('returns JSON 401 for signed-out all-bookings API requests', async () => {
    const response = await request(app).get('/api/bookings');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Authentication required' });
  });

  test('rejects non-admin API users and permits administrators', () => {
    const middleware = requireApiRole('admin');
    const next = vi.fn();
    const forbiddenResponse = createResponse();

    middleware({ user: { role: 'customer' } }, forbiddenResponse, next);

    expect(forbiddenResponse.status).toHaveBeenCalledWith(403);
    expect(forbiddenResponse.json).toHaveBeenCalledWith({ error: 'Forbidden' });
    expect(next).not.toHaveBeenCalled();

    const adminNext = vi.fn();
    middleware({ user: { role: 'admin' } }, createResponse(), adminNext);

    expect(adminNext).toHaveBeenCalledOnce();
  });

  test('rejects non-admin page users and permits administrators', () => {
    const middleware = requirePageRole('admin');
    const next = vi.fn();
    const forbiddenResponse = createResponse();

    middleware({ user: { role: 'customer' } }, forbiddenResponse, next);

    expect(forbiddenResponse.status).toHaveBeenCalledWith(403);
    expect(forbiddenResponse.render).toHaveBeenCalledWith('errors/403', {
      title: 'Forbidden',
    });
    expect(next).not.toHaveBeenCalled();

    const adminNext = vi.fn();
    middleware({ user: { role: 'admin' } }, createResponse(), adminNext);

    expect(adminNext).toHaveBeenCalledOnce();
  });
});
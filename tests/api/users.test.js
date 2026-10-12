import { beforeEach, describe, expect, test } from 'vitest';
import request from 'supertest';

import app from '../../app.js';
import { createUser } from '../../src/models/users.js';
import User from '../../src/models/schemas/users.js';

const TEST_PASSWORD = 'TestPassword123!';

const testUsers = {
  admin: {
    displayName: 'Admin User',
    username: 'adminuser',
    email: 'admin@example.com',
    password: TEST_PASSWORD,
  },
  firstUser: {
    displayName: 'First User',
    username: 'firstuser',
    email: 'first@example.com',
    password: TEST_PASSWORD,
  },
  secondUser: {
    displayName: 'Second User',
    username: 'seconduser',
    email: 'second@example.com',
    password: TEST_PASSWORD,
  },
};

let adminAgent;
let firstUserAgent;
let secondUserAgent;

const login = async (agent, user) => {
  const response = await agent.post('/login').type('form').send({
    email: user.email,
    password: user.password,
  });

  expect(response.status).toBe(302);
};

const expectNoSensitiveFields = (users) => {
  for (const user of users) {
    expect(user).not.toHaveProperty('passwordHash');

    const sensitiveFields = Object.keys(user).filter((field) =>
      /password|token|secret|session/i.test(field)
    );

    expect(sensitiveFields).toEqual([]);
  }
};

beforeEach(async () => {
  // Create three users using the existing model function.
  const adminId = await createUser(testUsers.admin);
  await createUser(testUsers.firstUser);
  await createUser(testUsers.secondUser);

  // Promote one user to administrator.
  await User.findByIdAndUpdate(adminId, { role: '2' });

  // Separate agents maintain independent login sessions.
  adminAgent = request.agent(app);
  firstUserAgent = request.agent(app);
  secondUserAgent = request.agent(app);

  await login(adminAgent, testUsers.admin);
  await login(firstUserAgent, testUsers.firstUser);
  await login(secondUserAgent, testUsers.secondUser);
});

describe('GET /api/users authentication', () => {
  test('returns 401 when the request is unauthenticated', async () => {
    const response = await request(app).get('/api/users');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'Authentication required',
    });
  });
});

describe('GET /api/users administrator access', () => {
  test('allows an administrator to retrieve all users', async () => {
    const response = await adminAgent.get('/api/users');

    expect(response.status).toBe(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        data: expect.any(Array),
        pagination: expect.objectContaining({
          page: 1,
          limit: 10,
          totalItems: 3,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        }),
      })
    );

    expect(response.body.data).toHaveLength(3);

    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          username: testUsers.admin.username,
          email: testUsers.admin.email,
        }),
        expect.objectContaining({
          username: testUsers.firstUser.username,
          email: testUsers.firstUser.email,
        }),
        expect.objectContaining({
          username: testUsers.secondUser.username,
          email: testUsers.secondUser.email,
        }),
      ])
    );
  });

  test('does not expose sensitive authentication fields', async () => {
    const response = await adminAgent.get('/api/users');

    expect(response.status).toBe(200);
    expectNoSensitiveFields(response.body.data);
  });

  test('supports pagination when retrieving users', async () => {
    const response = await adminAgent.get('/api/users?page=1&limit=2');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);

    expect(response.body.pagination).toEqual(
      expect.objectContaining({
        page: 1,
        limit: 2,
        totalItems: 3,
        totalPages: 2,
        hasNextPage: true,
        hasPreviousPage: false,
      })
    );
  });
});

describe('GET /api/users regular-user access', () => {
  test('returns only the authenticated user', async () => {
    const response = await firstUserAgent.get('/api/users');

    expect(response.status).toBe(200);

    expect(response.body.data).toHaveLength(1);

    expect(response.body.data[0]).toEqual(
      expect.objectContaining({
        username: testUsers.firstUser.username,
        email: testUsers.firstUser.email,
      })
    );

    expect(response.body.pagination).toEqual(
      expect.objectContaining({
        totalItems: 1,
        totalPages: 1,
      })
    );
  });

  test('does not expose other users', async () => {
    const response = await firstUserAgent.get('/api/users');

    expect(response.status).toBe(200);

    const usernames = response.body.data.map((user) => user.username);

    expect(usernames).toContain(testUsers.firstUser.username);
    expect(usernames).not.toContain(testUsers.admin.username);
    expect(usernames).not.toContain(testUsers.secondUser.username);
  });

  test('returns only its own record for another regular user', async () => {
    const response = await secondUserAgent.get('/api/users');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);

    expect(response.body.data[0]).toEqual(
      expect.objectContaining({
        username: testUsers.secondUser.username,
        email: testUsers.secondUser.email,
      })
    );
  });

  test('does not expose sensitive authentication fields', async () => {
    const response = await firstUserAgent.get('/api/users');

    expect(response.status).toBe(200);
    expectNoSensitiveFields(response.body.data);
  });
});
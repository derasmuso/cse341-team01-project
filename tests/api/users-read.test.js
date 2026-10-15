/**
 * Read-tests file with tests setup for authentication
 * sessions, sensitive-data checks, and expected 
 * behavior. 
 * It remains focused on read operations only and
 * retains your existing tests. 
 */

import { beforeEach, describe, expect, test } from 'vitest';
import request from 'supertest';

import app from '../../app.js';
import { createUser } from '../../src/models/users.js';
import { getRoleByName } from '../../src/models/roles.js';
import User from '../../src/models/schemas/users.js';

// Use the same password for test accounts to simplify login setup.
const TEST_PASSWORD = 'TestPassword123!';

// Define predictable test users so tests can identify records by stable values
// instead of hardcoding generated MongoDB IDs.
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

// Each agent maintains its own session so requests use the correct user's
// authentication credentials.
let adminAgent;
let firstUserAgent;
let secondUserAgent;

// Log in through the real application rather than bypassing authentication.
// The redirect confirms that the login endpoint accepted the credentials.
const login = async (agent, user) => {
  const response = await agent.post('/login').type('form').send({
    email: user.email,
    password: user.password,
  });

  expect(response.status).toBe(302);
};

// Check that API responses do not expose private authentication information.
// This helper checks top-level fields on each returned user object.
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
  // The shared test setup should reset the temporary database before each
  // test. Create fresh users so every test has predictable records.
  const adminId = await createUser(testUsers.admin);
  await createUser(testUsers.firstUser);
  await createUser(testUsers.secondUser);
  
  // Retrieve the administrator role defined by the application.
  const adminRole = await getRoleByName('admin');

  if (!adminRole) {
    throw new Error('Administrator role not found in the test database');
  }

  // Assign the role reference expected by the user schema.
  await User.findByIdAndUpdate(adminId, {
    role: adminRole.id,
  });

  // Create independent sessions for the administrator and regular users.
  adminAgent = request.agent(app);
  firstUserAgent = request.agent(app);
  secondUserAgent = request.agent(app);

  // Authenticate each agent through the real login endpoint.
  await login(adminAgent, testUsers.admin);
  await login(firstUserAgent, testUsers.firstUser);
  await login(secondUserAgent, testUsers.secondUser);
});

describe('GET /api/users authentication', () => {
  test('returns 401 when the request is unauthenticated', async () => {
    // Use a plain request instead of an authenticated agent.
    const response = await request(app).get('/api/users');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'Authentication required',
    });
  });
});

/*******************************************
 *  Administrator Access
 * *************************************** */
describe('GET /api/users administrator access', () => {
  test('allows an administrator to retrieve all users', async () => {
    const response = await adminAgent.get('/api/users');

    expect(response.status).toBe(200);

    // Verify the response structure and default pagination metadata.
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

    // Check that all three expected accounts are present, regardless of order.
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

  test('supports basic pagination when retrieving users', async () => {
    // This is a basic read-endpoint check; detailed pagination and filtering
    // behavior belongs in the dedicated pagination-and-search test file.
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

/* *******************************************
 *  Regular User Access
 * *************************************** */
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

    // Pagination metadata should reflect the records visible to this user.
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

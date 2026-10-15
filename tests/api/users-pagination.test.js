
/**
 * Users pagination and search tests.
 *
 * Covers GET /api/users pagination, role filtering, keyword search,
 * combined filters, pagination metadata, and input validation.
 *
 * Tests use real authentication sessions and isolated test accounts.
 */

import { beforeEach, describe, expect, test } from 'vitest';
import request from 'supertest';

import app from '../../app.js';
import { createUser } from '../../src/models/users.js';
import { getRoleByName } from '../../src/models/roles.js';
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
  searchUser: {
    displayName: 'Phoenix Display',
    username: 'phoenixuser',
    email: 'contact@phoenixmail.test',
    password: TEST_PASSWORD,
  },
};

let adminAgent;
let firstUserAgent;

let adminId;
let firstUserId;

const login = async (agent, user) => {
  const response = await agent.post('/login').type('form').send({
    email: user.email,
    password: user.password,
  });

  expect(response.status).toBe(302);
};

const expectNoSensitiveFields = (user) => {
  expect(user).not.toHaveProperty('passwordHash');

  const sensitiveFields = Object.keys(user).filter((field) =>
    /password|token|secret|session/i.test(field)
  );

  expect(sensitiveFields).toEqual([]);
};

const expectPagination = (
  pagination,
  {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage,
    hasPreviousPage,
  }
) => {
  expect(pagination).toEqual({
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage,
    hasPreviousPage,
  });
};

const createAdditionalUsers = async () => {
  // Eight additional users bring the total to twelve.
  for (let number = 3; number <= 10; number += 1) {
    const suffix = String(number).padStart(2, '0');

    await createUser({
      displayName: `Test User ${suffix}`,
      username: `user${suffix}`,
      email: `user${suffix}@example.com`,
      password: TEST_PASSWORD,
    });
  }
};

beforeEach(async () => {
  /*
   * The existing shared test setup must reset the temporary database
   * before each test. Never run these tests against production data.
   */

  adminId = await createUser(testUsers.admin);
  firstUserId = await createUser(testUsers.firstUser);

  await createUser(testUsers.secondUser);
  await createUser(testUsers.searchUser);

  await createAdditionalUsers();

  const adminRole = await getRoleByName('admin');

  if (!adminRole) {
    throw new Error('Administrator role not found in the test database');
  }

  await User.findByIdAndUpdate(adminId, {
    role: adminRole.id,
  });

  adminAgent = request.agent(app);
  firstUserAgent = request.agent(app);

  await login(adminAgent, testUsers.admin);
  await login(firstUserAgent, testUsers.firstUser);
});

/*******************************************
 * GET /api/users — Authentication
 *******************************************/

describe('GET /api/users authentication', () => {
  test('returns 401 when the request is unauthenticated', async () => {
    const response = await request(app).get('/api/users');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'Authentication required',
    });
  });
});

/*******************************************
 * GET /api/users — Pagination
 *******************************************/

describe('GET /api/users pagination', () => {
  test('returns the first page with default pagination', async () => {
    const response = await adminAgent.get('/api/users');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(10);

    expectPagination(response.body.pagination, {
      page: 1,
      limit: 10,
      totalItems: 12,
      totalPages: 2,
      hasNextPage: true,
      hasPreviousPage: false,
    });

    // Default ordering is username ascending.
    expect(
      response.body.data.map((user) => user.username)
    ).toEqual([
      'adminuser',
      'firstuser',
      'phoenixuser',
      'seconduser',
      'user03',
      'user04',
      'user05',
      'user06',
      'user07',
      'user08',
    ]);

    response.body.data.forEach(expectNoSensitiveFields);
  });

  test('returns the requested page and limit', async () => {
    const response = await adminAgent
      .get('/api/users')
      .query({ page: 2, limit: 5 });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(5);

    expectPagination(response.body.pagination, {
      page: 2,
      limit: 5,
      totalItems: 12,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: true,
    });

    expect(
      response.body.data.map((user) => user.username)
    ).toEqual([
      'user04',
      'user05',
      'user06',
      'user07',
      'user08',
    ]);
  });

  test('returns the remaining users on the last page', async () => {
    const response = await adminAgent
      .get('/api/users')
      .query({ page: 3, limit: 5 });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);

    expectPagination(response.body.pagination, {
      page: 3,
      limit: 5,
      totalItems: 12,
      totalPages: 3,
      hasNextPage: false,
      hasPreviousPage: true,
    });

    expect(
      response.body.data.map((user) => user.username)
    ).toEqual(['user09', 'user10']);
  });

  test('does not return duplicate users across consecutive pages', async () => {
    const firstPage = await adminAgent
      .get('/api/users')
      .query({ page: 1, limit: 5 });

    const secondPage = await adminAgent
      .get('/api/users')
      .query({ page: 2, limit: 5 });

    expect(firstPage.status).toBe(200);
    expect(secondPage.status).toBe(200);

    const firstPageIds = firstPage.body.data.map((user) => user._id);
    const secondPageIds = secondPage.body.data.map((user) => user._id);

    expect(
      firstPageIds.some((id) => secondPageIds.includes(id))
    ).toBe(false);
  });

  test('returns an empty page beyond the available results', async () => {
    const response = await adminAgent
      .get('/api/users')
      .query({ page: 99, limit: 10 });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);

    expectPagination(response.body.pagination, {
      page: 99,
      limit: 10,
      totalItems: 12,
      totalPages: 2,
      hasNextPage: false,
      hasPreviousPage: true,
    });
  });
});

/*******************************************
 * GET /api/users — Role filtering
 *******************************************/

describe('GET /api/users role filtering', () => {
  test('returns only customer accounts for role 1', async () => {
    const response = await adminAgent
      .get('/api/users')
      .query({ role: '1' });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(10);

    expectPagination(response.body.pagination, {
      page: 1,
      limit: 10,
      totalItems: 11,
      totalPages: 2,
      hasNextPage: true,
      hasPreviousPage: false,
    });

    expect(
      response.body.data.every((user) => String(user.role) === '1')
    ).toBe(true);
  });

  test('returns only administrators for role 2', async () => {
    const response = await adminAgent
      .get('/api/users')
      .query({ role: '2' });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].username).toBe('adminuser');

    expectPagination(response.body.pagination, {
      page: 1,
      limit: 10,
      totalItems: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });
  });

  test('calculates pagination metadata after role filtering', async () => {
    const response = await adminAgent
      .get('/api/users')
      .query({ role: '1', limit: 5 });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(5);

    expectPagination(response.body.pagination, {
      page: 1,
      limit: 5,
      totalItems: 11,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: false,
    });
  });

  test('returns 400 for an invalid role', async () => {
    const response = await adminAgent
      .get('/api/users')
      .query({ role: '99' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'Invalid role. Allowed values are 1 and 2.'
    );
  });
});

/*******************************************
 * GET /api/users — Keyword search
 *******************************************/

describe('GET /api/users keyword search', () => {
  test('searches by display name', async () => {
    const response = await adminAgent
      .get('/api/users')
      .query({ q: 'Phoenix Display' });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].displayName).toBe('Phoenix Display');

    expectPagination(response.body.pagination, {
      page: 1,
      limit: 10,
      totalItems: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });
  });

  test('searches by username', async () => {
    const response = await adminAgent
      .get('/api/users')
      .query({ q: 'phoenixuser' });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].username).toBe('phoenixuser');
  });

  test('searches by email address', async () => {
    const response = await adminAgent
      .get('/api/users')
      .query({ q: 'phoenixmail' });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].email).toBe(
      'contact@phoenixmail.test'
    );
  });

  test('supports partial, case-insensitive matching', async () => {
    const response = await adminAgent
      .get('/api/users')
      .query({ q: 'PHOENIX' });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].username).toBe('phoenixuser');
  });

  test('returns 200 and empty results when there are no matches', async () => {
    const response = await adminAgent
      .get('/api/users')
      .query({ q: 'no-such-user-xyz' });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);

    expectPagination(response.body.pagination, {
      page: 1,
      limit: 10,
      totalItems: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    });
  });

  test('returns 400 when the search query exceeds 100 characters', async () => {
    const response = await adminAgent
      .get('/api/users')
      .query({ q: 'a'.repeat(101) });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'Search query must not exceed 100 characters.'
    );
  });
});

/*******************************************
 * GET /api/users — Combined filters
 *******************************************/

describe('GET /api/users combined filters', () => {
  test('combines keyword search and role filtering', async () => {
    const response = await adminAgent
      .get('/api/users')
      .query({
        q: 'PHOENIX',
        role: '1',
      });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].username).toBe('phoenixuser');
    expect(String(response.body.data[0].role)).toBe('1');

    expectPagination(response.body.pagination, {
      page: 1,
      limit: 10,
      totalItems: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });
  });

  test('applies pagination after search and role filtering', async () => {
    const response = await adminAgent
      .get('/api/users')
      .query({
        q: 'user',
        role: '1',
        page: 2,
        limit: 3,
      });

    expect(response.status).toBe(200);

    // Only customer usernames matching "user" are counted.
    expect(response.body.pagination.totalItems).toBe(11);
    expect(response.body.pagination.totalPages).toBe(4);
    expect(response.body.pagination.page).toBe(2);
    expect(response.body.pagination.limit).toBe(3);
    expect(response.body.pagination.hasNextPage).toBe(true);
    expect(response.body.pagination.hasPreviousPage).toBe(true);

    expect(response.body.data).toHaveLength(3);

    expect(
      response.body.data.every(
        (user) =>
          String(user.role) === '1' &&
          /user/i.test(
            `${user.displayName} ${user.username} ${user.email}`
          )
      )
    ).toBe(true);
  });
});

/*******************************************
 * GET /api/users — Authorization and privacy
 *******************************************/

describe('GET /api/users authorization and privacy', () => {
  test('restricts regular users to their own account', async () => {
    const response = await firstUserAgent.get('/api/users');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].username).toBe('firstuser');

    expectPagination(response.body.pagination, {
      page: 1,
      limit: 10,
      totalItems: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });

    response.body.data.forEach(expectNoSensitiveFields);
  });

  test('does not expose sensitive authentication fields', async () => {
    const response = await adminAgent
      .get('/api/users')
      .query({ limit: 100 });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(12);

    response.body.data.forEach(expectNoSensitiveFields);
  });

  test('returns 404 when a regular user has no matching results', async () => {
    const response = await firstUserAgent
      .get('/api/users')
      .query({ q: 'no-such-user-xyz' });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('User not found');
  });
});

/*******************************************
 * GET /api/users — Query validation
 *******************************************/

describe('GET /api/users query validation', () => {
  test.each([
    ['page', '0'],
    ['page', '-1'],
    ['page', '1.5'],
    ['page', 'abc'],
    ['limit', '0'],
    ['limit', '101'],
    ['limit', 'abc'],
    ['sort', 'passwordHash'],
    ['order', 'sideways'],
  ])('returns 400 for invalid %s=%s', async (key, value) => {
    const response = await adminAgent
      .get('/api/users')
      .query({ [key]: value });

    expect(response.status).toBe(400);
  });
});

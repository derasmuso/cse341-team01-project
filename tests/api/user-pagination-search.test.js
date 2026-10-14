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
    displayName: 'DisplayNeedle Person',
    username: 'firstuser',
    email: 'first@example.com',
    password: TEST_PASSWORD,
  },
  secondUser: {
    displayName: 'Second User',
    username: 'UsernameNeedle',
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
  const adminId = await createUser(testUsers.admin);
  await createUser(testUsers.firstUser);
  await createUser(testUsers.secondUser);

  await User.findByIdAndUpdate(adminId, { role: '2' });

  adminAgent = request.agent(app);
  firstUserAgent = request.agent(app);
  secondUserAgent = request.agent(app);

  await login(adminAgent, testUsers.admin);
  await login(firstUserAgent, testUsers.firstUser);
  await login(secondUserAgent, testUsers.secondUser);
});

describe('GET /api/users pagination', () => {
  test('uses default pagination values', async () => {
    const response = await adminAgent.get('/api/users');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(3);

    expect(response.body.pagination).toEqual(
      expect.objectContaining({
        page: 1,
        limit: 10,
        totalItems: 3,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      })
    );
  });

  test('returns the correct records and metadata for a requested page', async () => {
    const firstPage = await adminAgent.get(
      '/api/users?page=1&limit=2&sort=username&order=asc'
    );

    expect(firstPage.status).toBe(200);
    expect(firstPage.body.data).toHaveLength(2);

    expect(firstPage.body.data.map((user) => user.username)).toEqual([
      'adminuser',
      'firstuser',
    ]);

    expect(firstPage.body.pagination).toEqual(
      expect.objectContaining({
        page: 1,
        limit: 2,
        totalItems: 3,
        totalPages: 2,
        hasNextPage: true,
        hasPreviousPage: false,
      })
    );

    const secondPage = await adminAgent.get(
      '/api/users?page=2&limit=2&sort=username&order=asc'
    );

    expect(secondPage.status).toBe(200);
    expect(secondPage.body.data).toHaveLength(1);
    expect(secondPage.body.data[0].username).toBe('UsernameNeedle');

    expect(secondPage.body.pagination).toEqual(
      expect.objectContaining({
        page: 2,
        limit: 2,
        totalItems: 3,
        totalPages: 2,
        hasNextPage: false,
        hasPreviousPage: true,
      })
    );
  });

  test('returns an empty page when the requested page exceeds available results', async () => {
    const response = await adminAgent.get(
      '/api/users?page=5&limit=2'
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);

    expect(response.body.pagination).toEqual(
      expect.objectContaining({
        page: 5,
        limit: 2,
        totalItems: 3,
        totalPages: 2,
        hasNextPage: false,
        hasPreviousPage: true,
      })
    );
  });

  test('sorts users in ascending and descending order', async () => {
    const ascending = await adminAgent.get(
      '/api/users?sort=username&order=asc'
    );

    expect(ascending.status).toBe(200);
    expect(ascending.body.data.map((user) => user.username)).toEqual([
      'adminuser',
      'firstuser',
      'UsernameNeedle',
    ]);

    const descending = await adminAgent.get(
      '/api/users?sort=username&order=desc'
    );

    expect(descending.status).toBe(200);
    expect(descending.body.data.map((user) => user.username)).toEqual([
      'UsernameNeedle',
      'firstuser',
      'adminuser',
    ]);
  });
});

describe('GET /api/users keyword search', () => {
  test('searches display names without case sensitivity', async () => {
    const response = await adminAgent.get(
      '/api/users?q=displayneedle'
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);

    expect(response.body.data[0]).toEqual(
      expect.objectContaining({
        displayName: testUsers.firstUser.displayName,
        username: testUsers.firstUser.username,
      })
    );

    expect(response.body.pagination.totalItems).toBe(1);
  });

  test('searches usernames without case sensitivity', async () => {
    const response = await adminAgent.get(
      '/api/users?q=usernameneedle'
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);

    expect(response.body.data[0]).toEqual(
      expect.objectContaining({
        username: testUsers.secondUser.username,
        email: testUsers.secondUser.email,
      })
    );

    expect(response.body.pagination.totalItems).toBe(1);
  });

  test('searches email addresses', async () => {
    const response = await adminAgent.get(
      '/api/users?q=first%40example.com'
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);

    expect(response.body.data[0]).toEqual(
      expect.objectContaining({
        email: testUsers.firstUser.email,
      })
    );
  });

  test('returns an empty result when no users match the keyword', async () => {
    const response = await adminAgent.get(
      '/api/users?q=nomatchinguser123'
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);

    expect(response.body.pagination).toEqual(
      expect.objectContaining({
        page: 1,
        limit: 10,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      })
    );
  });

  test('treats regular expression characters as literal search text', async () => {
    const response = await adminAgent.get(
      '/api/users?q=%5Babc%5D'
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
    expect(response.body.pagination.totalItems).toBe(0);
  });

  test('treats whitespace-only search input as no keyword filter', async () => {
    const response = await adminAgent.get('/api/users?q=%20%20%20');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(3);
    expect(response.body.pagination.totalItems).toBe(3);
  });
});

describe('GET /api/users role filtering', () => {
  test('returns only regular users when role=1', async () => {
    const response = await adminAgent.get('/api/users?role=1');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.pagination.totalItems).toBe(2);

    expect(response.body.data.every((user) => user.role === '1')).toBe(
      true
    );
  });

  test('returns only administrators when role=2', async () => {
    const response = await adminAgent.get('/api/users?role=2');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);

    expect(response.body.data[0]).toEqual(
      expect.objectContaining({
        username: testUsers.admin.username,
        role: '2',
      })
    );

    expect(response.body.pagination.totalItems).toBe(1);
  });

  test('returns an empty result when a valid role has no matching users', async () => {
    // The role exists, but no users currently have it.
    const response = await adminAgent.get('/api/users?role=3');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
    expect(response.body.pagination.totalItems).toBe(0);
    expect(response.body.pagination.totalPages).toBe(0);
  });
});

describe('GET /api/users combined search and role filtering', () => {
  test('applies keyword search and role filtering together', async () => {
    const response = await adminAgent.get(
      '/api/users?q=second&role=1'
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);

    expect(response.body.data[0]).toEqual(
      expect.objectContaining({
        username: testUsers.secondUser.username,
        role: '1',
      })
    );

    expect(response.body.pagination.totalItems).toBe(1);
  });

  test('returns no matches when the keyword and role filters do not overlap', async () => {
    const response = await adminAgent.get(
      '/api/users?q=displayneedle&role=2'
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
    expect(response.body.pagination.totalItems).toBe(0);
    expect(response.body.pagination.totalPages).toBe(0);
  });

  test('applies pagination to filtered results', async () => {
    const response = await adminAgent.get(
      '/api/users?role=1&page=1&limit=1&sort=username&order=asc'
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);

    expect(response.body.pagination).toEqual(
      expect.objectContaining({
        page: 1,
        limit: 1,
        totalItems: 2,
        totalPages: 2,
        hasNextPage: true,
        hasPreviousPage: false,
      })
    );
  });
});

describe('GET /api/users query validation', () => {
  test.each([
    ['zero page', '?page=0'],
    ['negative page', '?page=-1'],
    ['fractional page', '?page=1.5'],
    ['non-numeric page', '?page=abc'],
    ['empty page', '?page='],
    ['zero limit', '?limit=0'],
    ['limit above maximum', '?limit=101'],
    ['fractional limit', '?limit=1.5'],
    ['unsupported sort field', '?sort=role'],
    ['invalid sort order', '?order=up'],
    ['invalid role', '?role=invalid'],
  ])('returns 400 for %s', async (_description, query) => {
    const response = await adminAgent.get(`/api/users${query}`);

    expect(response.status).toBe(400);
  });

  test('rejects a keyword longer than 100 characters', async () => {
    const keyword = 'a'.repeat(101);

    const response = await adminAgent.get(
      `/api/users?q=${keyword}`
    );

    expect(response.status).toBe(400);
  });
});

describe('GET /api/users regular-user authorization', () => {
  test('search returns only the authenticated user', async () => {
    const response = await firstUserAgent.get(
      '/api/users?q=displayneedle'
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].username).toBe(
      testUsers.firstUser.username
    );
    expect(response.body.pagination.totalItems).toBe(1);
  });

  test('role filtering cannot expose other users', async () => {
    const response = await firstUserAgent.get('/api/users?role=2');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
    expect(response.body.pagination.totalItems).toBe(0);
  });

  test('pagination cannot expose other users', async () => {
    const response = await secondUserAgent.get(
      '/api/users?page=1&limit=100'
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].username).toBe(
      testUsers.secondUser.username
    );
    expect(response.body.pagination.totalItems).toBe(1);
  });
});

describe('GET /api/users response data protection', () => {
  test('does not expose sensitive fields in search results', async () => {
    const response = await adminAgent.get('/api/users?q=user');

    expect(response.status).toBe(200);
    expectNoSensitiveFields(response.body.data);
  });

  test('does not expose sensitive fields in role-filtered results', async () => {
    const response = await adminAgent.get('/api/users?role=1');

    expect(response.status).toBe(200);
    expectNoSensitiveFields(response.body.data);
  });
});

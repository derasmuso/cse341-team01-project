
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
let adminId;
let firstUserId;
let secondUserId;

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

beforeEach(async () => {
  adminId = await createUser(testUsers.admin);
  firstUserId = await createUser(testUsers.firstUser);
  secondUserId = await createUser(testUsers.secondUser);

  await User.findByIdAndUpdate(adminId, { role: '2' });

  adminAgent = request.agent(app);
  firstUserAgent = request.agent(app);
  secondUserAgent = request.agent(app);

  await login(adminAgent, testUsers.admin);
  await login(firstUserAgent, testUsers.firstUser);
  await login(secondUserAgent, testUsers.secondUser);
});

describe('PUT /api/users/:id authentication', () => {
  test('returns 401 when the request is unauthenticated', async () => {
    const response = await request(app)
      .put(`/api/users/${firstUserId}`)
      .send({ displayName: 'Updated Name' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'Authentication required',
    });
  });
});

describe('PUT /api/users/:id administrator access', () => {
  test('allows an administrator to update another user', async () => {
    const response = await adminAgent
      .put(`/api/users/${firstUserId}`)
      .send({ displayName: 'Updated First User' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        displayName: 'Updated First User',
        username: testUsers.firstUser.username,
      })
    );

    expectNoSensitiveFields(response.body);

    const updatedUser = await User.findById(firstUserId).lean();
    expect(updatedUser.displayName).toBe('Updated First User');
  });

  test('allows an administrator to change a user role', async () => {
    const response = await adminAgent
      .put(`/api/users/${firstUserId}`)
      .send({ role: '2' });

    expect(response.status).toBe(200);

    const updatedUser = await User.findById(firstUserId).lean();
    expect(updatedUser.role).toBe('2');
  });

  test('returns 404 when the target user does not exist', async () => {
    const response = await adminAgent
      .put('/api/users/507f1f77bcf86cd799439011')
      .send({ displayName: 'Updated Name' });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message: 'User not found',
    });
  });
});

describe('PUT /api/users/:id regular-user access', () => {
  test('allows a user to update their own display name', async () => {
    const response = await firstUserAgent
      .put(`/api/users/${firstUserId}`)
      .send({ displayName: 'My Updated Name' });

    expect(response.status).toBe(200);
    expect(response.body.displayName).toBe('My Updated Name');
    expectNoSensitiveFields(response.body);

    const updatedUser = await User.findById(firstUserId).lean();
    expect(updatedUser.displayName).toBe('My Updated Name');
  });

  test('allows a user to update their own email', async () => {
    const response = await firstUserAgent
      .put(`/api/users/${firstUserId}`)
      .send({ email: '  NEWEMAIL@EXAMPLE.COM  ' });

    expect(response.status).toBe(200);
    expect(response.body.email).toBe('newemail@example.com');

    const updatedUser = await User.findById(firstUserId).lean();
    expect(updatedUser.email).toBe('newemail@example.com');
  });

  test('does not allow a user to update another user', async () => {
    const response = await firstUserAgent
      .put(`/api/users/${secondUserId}`)
      .send({ displayName: 'Unauthorized Change' });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      message: 'You are not authorized to update this user',
    });

    const unchangedUser = await User.findById(secondUserId).lean();
    expect(unchangedUser.displayName).toBe(
      testUsers.secondUser.displayName
    );
  });

  test('does not allow a user to promote themselves to administrator', async () => {
    const response = await firstUserAgent
      .put(`/api/users/${firstUserId}`)
      .send({ role: '2' });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      message: 'You are not authorized to change the user role',
    });

    const unchangedUser = await User.findById(firstUserId).lean();
    expect(unchangedUser.role).toBe('1');
  });

  test('allows a user to update their own password', async () => {
    const newPassword = 'AnotherPassword456!';

    const response = await firstUserAgent
      .put(`/api/users/${firstUserId}`)
      .send({ password: newPassword });

    expect(response.status).toBe(200);
    expectNoSensitiveFields(response.body);

    // Verify the new password works through the actual login endpoint.
    const newAgent = request.agent(app);
    const loginResponse = await newAgent.post('/login').type('form').send({
      email: testUsers.firstUser.email,
      password: newPassword,
    });

    expect(loginResponse.status).toBe(302);
  });
});

describe('PUT /api/users/:id validation', () => {
  test('returns 400 for an invalid user ID', async () => {
    const response = await adminAgent
      .put('/api/users/invalid-id')
      .send({ displayName: 'Updated Name' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'Invalid user ID',
    });
  });

  test('returns 400 when no update data is provided', async () => {
    const response = await adminAgent
      .put(`/api/users/${firstUserId}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'No update data provided',
    });
  });

  test('returns 400 when an unsupported field is provided', async () => {
    const response = await adminAgent
      .put(`/api/users/${firstUserId}`)
      .send({ username: 'newusername' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'Invalid user data',
    });
  });

  test('returns 400 for an empty display name', async () => {
    const response = await adminAgent
      .put(`/api/users/${firstUserId}`)
      .send({ displayName: '   ' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'Invalid displayName',
    });
  });

  test('returns 400 for an invalid email', async () => {
    const response = await adminAgent
      .put(`/api/users/${firstUserId}`)
      .send({ email: '   ' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'Invalid email',
    });
  });

  test('returns 400 for a password shorter than eight characters', async () => {
    const response = await adminAgent
      .put(`/api/users/${firstUserId}`)
      .send({ password: 'short' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'Password must be at least 8 characters',
    });
  });

  test('returns 400 for an invalid role', async () => {
    const response = await adminAgent
      .put(`/api/users/${firstUserId}`)
      .send({ role: '99' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'Invalid role',
    });
  });

  test('returns 400 when the email is already in use', async () => {
    const response = await adminAgent
      .put(`/api/users/${firstUserId}`)
      .send({ email: testUsers.secondUser.email });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'Email is already in use',
    });
  });
});

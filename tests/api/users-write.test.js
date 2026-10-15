
/**
 * Users write tests.
 *
 * Covers PUT /api/users/:id and DELETE /api/users/:id.
 * Tests use real authentication sessions, isolated test accounts,
 * and database assertions to verify the results of write operations.
 */

import { beforeEach, describe, expect, test } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';

import app from '../../app.js';
import { createUser } from '../../src/models/users.js';
import { getRoleByName } from '../../src/models/roles.js';
import User from '../../src/models/schemas/users.js';

// Use a consistent password to simplify authentication during tests.
const TEST_PASSWORD = 'TestPassword123!';

// Use predictable account details so tests can find records without
// relying on MongoDB IDs generated during setup.
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

// Use independent agents so each account maintains its own session.
let adminAgent;
let firstUserAgent;
let secondUserAgent;

// Store the generated IDs for requests that target specific accounts.
let adminId;
let firstUserId;
let secondUserId;

// A valid ObjectId format that should not match a seeded test account.
const NONEXISTENT_USER_ID = '507f1f77bcf86cd799439011';

// Authenticate through the real login route instead of mocking sessions.
const login = async (agent, user) => {
  const response = await agent.post('/login').type('form').send({
    email: user.email,
    password: user.password,
  });

  expect(response.status).toBe(302);
};

// Check that a response does not expose authentication-related fields.
const expectNoSensitiveFields = (user) => {
  expect(user).not.toHaveProperty('passwordHash');

  const sensitiveFields = Object.keys(user).filter((field) =>
    /password|token|secret|session/i.test(field)
  );

  expect(sensitiveFields).toEqual([]);
};

// Verify that a user exists in the database using a unique email address.
const findUserByEmail = async (email) => {
  return User.findOne({ email: email.toLowerCase() });
};

beforeEach(async () => {
  /*
   * This suite relies on the existing shared test setup to reset the
   * temporary database before each test. Do not run these tests against
   * a development or production database.
   */

  adminId = await createUser(testUsers.admin);
  firstUserId = await createUser(testUsers.firstUser);
  secondUserId = await createUser(testUsers.secondUser);

  // Assign the actual administrator role defined by the application.
  const adminRole = await getRoleByName('admin');

  if (!adminRole) {
    throw new Error('Administrator role not found in the test database');
  }

  await User.findByIdAndUpdate(adminId, {
    role: adminRole.id,
  });

  // Create independent cookie jars for the three authenticated accounts.
  adminAgent = request.agent(app);
  firstUserAgent = request.agent(app);
  secondUserAgent = request.agent(app);

  await login(adminAgent, testUsers.admin);
  await login(firstUserAgent, testUsers.firstUser);
  await login(secondUserAgent, testUsers.secondUser);
});

/*******************************************
 * PUT /api/users/:id — Authentication
 *******************************************/

describe('PUT /api/users/:id authentication', () => {
  test('returns 401 when the request is unauthenticated', async () => {
    const response = await request(app)
      .put(`/api/users/${firstUserId}`)
      .send({ displayName: 'Updated Name' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'Authentication required',
    });

    // The unauthenticated request must not modify the database record.
    const user = await findUserByEmail(testUsers.firstUser.email);

    expect(user.displayName).toBe(testUsers.firstUser.displayName);
  });
});

/*******************************************
 * PUT /api/users/:id — Validation
 *******************************************/

describe('PUT /api/users/:id validation', () => {
  test('returns 400 for an invalid MongoDB user ID', async () => {
    const response = await firstUserAgent
      .put('/api/users/invalid-id')
      .send({ displayName: 'Updated Name' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid user ID');
  });

  test('returns 400 when the update body is empty', async () => {
    const response = await firstUserAgent
      .put(`/api/users/${firstUserId}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('No update data provided');
  });

  test('returns 400 when an unsupported field is provided', async () => {
    const response = await firstUserAgent
      .put(`/api/users/${firstUserId}`)
      .send({ username: 'changedusername' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid user data');
  });

  test('returns 400 when displayName is empty', async () => {
    const response = await firstUserAgent
      .put(`/api/users/${firstUserId}`)
      .send({ displayName: '   ' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid displayName');
  });

  test('returns 400 when email is empty', async () => {
    const response = await firstUserAgent
      .put(`/api/users/${firstUserId}`)
      .send({ email: '   ' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid email');
  });

  test('returns 400 when the password has fewer than eight characters', async () => {
    const response = await firstUserAgent
      .put(`/api/users/${firstUserId}`)
      .send({ password: 'short' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'Password must be at least 8 characters'
    );
  });

  test('returns 400 when an administrator supplies an invalid role', async () => {
    const response = await adminAgent
      .put(`/api/users/${firstUserId}`)
      .send({ role: '99' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid role');
  });

  test('returns 404 when the user ID is valid but the account does not exist', async () => {
    const response = await adminAgent
      .put(`/api/users/${NONEXISTENT_USER_ID}`)
      .send({ displayName: 'Unknown User' });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('User not found');
  });

  test('returns 400 when the email address is already in use', async () => {
    const response = await firstUserAgent
      .put(`/api/users/${firstUserId}`)
      .send({ email: testUsers.secondUser.email });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Email is already in use');

    // The conflicting update must not overwrite either account.
    const firstUser = await findUserByEmail(testUsers.firstUser.email);
    const secondUser = await findUserByEmail(testUsers.secondUser.email);

    expect(firstUser).not.toBeNull();
    expect(secondUser).not.toBeNull();
  });
});

/*******************************************
 * PUT /api/users/:id — Authorization
 *******************************************/

describe('PUT /api/users/:id authorization', () => {
  test('prevents a regular user from updating another user', async () => {
    const response = await firstUserAgent
      .put(`/api/users/${secondUserId}`)
      .send({ displayName: 'Unauthorized Change' });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe(
      'You are not authorized to update this user'
    );

    // Confirm that the attempted change was not persisted.
    const secondUser = await findUserByEmail(testUsers.secondUser.email);

    expect(secondUser.displayName).toBe(testUsers.secondUser.displayName);
  });

  test('prevents a regular user from changing their own role', async () => {
    const response = await firstUserAgent
      .put(`/api/users/${firstUserId}`)
      .send({ role: '2' });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe(
      'You are not authorized to change the user role'
    );
  });
});

/*******************************************
 * PUT /api/users/:id — Successful updates
 *******************************************/

describe('PUT /api/users/:id successful updates', () => {
  test('allows a regular user to update their own display name and email', async () => {
    const response = await firstUserAgent
      .put(`/api/users/${firstUserId}`)
      .send({
        displayName: '  Updated First User  ',
        email: '  UPDATED.FIRST@EXAMPLE.COM  ',
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        displayName: 'Updated First User',
        email: 'updated.first@example.com',
      })
    );

    // Verify that the normalized values were persisted in the database.
    const updatedUser = await findUserByEmail('updated.first@example.com');

    expect(updatedUser).not.toBeNull();
    expect(updatedUser.displayName).toBe('Updated First User');

    // Ensure the response does not expose authentication information.
    expectNoSensitiveFields(response.body);
  });

  test('allows an administrator to update another user', async () => {
    const response = await adminAgent
      .put(`/api/users/${firstUserId}`)
      .send({
        displayName: 'Admin Updated User',
      });

    expect(response.status).toBe(200);
    expect(response.body.displayName).toBe('Admin Updated User');

    // Confirm the administrator's change was saved.
    const updatedUser = await findUserByEmail(testUsers.firstUser.email);

    expect(updatedUser).not.toBeNull();
    expect(updatedUser.displayName).toBe('Admin Updated User');
    expectNoSensitiveFields(response.body);
  });

  test('allows an administrator to update a user role to a valid role ID', async () => {
    const response = await adminAgent
      .put(`/api/users/${firstUserId}`)
      .send({ role: '2' });

    expect(response.status).toBe(200);

    // The stored role should reflect the permitted role change.
    const updatedUser = await User.findById(firstUserId);

    expect(String(updatedUser.role)).toBe('2');
    expectNoSensitiveFields(response.body);
  });

  test('does not expose password information after a password update', async () => {
    const newPassword = 'NewSecurePassword456!';

    const response = await firstUserAgent
      .put(`/api/users/${firstUserId}`)
      .send({ password: newPassword });

    expect(response.status).toBe(200);
    expectNoSensitiveFields(response.body);

    // Confirm that the password was not stored in plain text.
    const updatedUser = await User.findById(firstUserId).select('+passwordHash');

    expect(updatedUser).not.toBeNull();
    expect(updatedUser.passwordHash).not.toBe(newPassword);
    expect(updatedUser.passwordHash).not.toBe(TEST_PASSWORD);
  });

  test('returns 404 when updating a user that has been deleted', async () => {
    // Remove the account first to simulate a record disappearing.
    await User.findByIdAndDelete(secondUserId);

    const response = await adminAgent
      .put(`/api/users/${secondUserId}`)
      .send({ displayName: 'Updated Missing User' });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('User not found');
  });
});

/*******************************************
 * DELETE /api/users/:id — Authentication
 *******************************************/

describe('DELETE /api/users/:id authentication', () => {
  test('returns 401 when the request is unauthenticated', async () => {
    const response = await request(app).delete(
      `/api/users/${firstUserId}`
    );

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'Authentication required',
    });

    // An unauthenticated request must not delete the account.
    const user = await User.findById(firstUserId);

    expect(user).not.toBeNull();
  });
});

/*******************************************
 * DELETE /api/users/:id — Validation
 *******************************************/

describe('DELETE /api/users/:id validation', () => {
  test('returns 400 for an invalid MongoDB user ID', async () => {
    const response = await firstUserAgent.delete(
      '/api/users/invalid-id'
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid user ID');
  });

  test('returns 404 when the user does not exist', async () => {
    const response = await adminAgent.delete(
      `/api/users/${NONEXISTENT_USER_ID}`
    );

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('User not found');
  });
});

/*******************************************
 * DELETE /api/users/:id — Authorization
 *******************************************/

describe('DELETE /api/users/:id authorization', () => {
  test('prevents a regular user from deleting another user', async () => {
    const response = await firstUserAgent.delete(
      `/api/users/${secondUserId}`
    );

    expect(response.status).toBe(403);
    expect(response.body.message).toBe(
      'You are not authorized to delete this user'
    );

    // Verify that the target account remains in the database.
    const secondUser = await User.findById(secondUserId);

    expect(secondUser).not.toBeNull();
  });
});

/*******************************************
 * DELETE /api/users/:id — Successful deletion
 *******************************************/

describe('DELETE /api/users/:id successful deletion', () => {
  test('allows an administrator to delete another user', async () => {
    const response = await adminAgent.delete(
      `/api/users/${secondUserId}`
    );

    expect(response.status).toBe(200);

    // The controller returns the deleted user object for admin deletion.
    expect(response.body).toEqual(
      expect.objectContaining({
        email: testUsers.secondUser.email,
      })
    );

    expectNoSensitiveFields(response.body);

    // The deleted account must no longer exist.
    const deletedUser = await User.findById(secondUserId);

    expect(deletedUser).toBeNull();

    // Deleting another account must not terminate the admin's session.
    const adminResponse = await adminAgent.get('/api/users');

    expect(adminResponse.status).toBe(200);
  });

  test('allows a regular user to delete their own account and terminate the session', async () => {
    const response = await firstUserAgent.delete(
      `/api/users/${firstUserId}`
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: 'Account deleted successfully. Session terminated.',
    });

    // Verify that the account was removed.
    const deletedUser = await User.findById(firstUserId);

    expect(deletedUser).toBeNull();

    // The same agent should no longer be authenticated.
    const subsequentResponse = await firstUserAgent.get('/api/users');

    expect(subsequentResponse.status).toBe(401);
  });

  test('does not delete unrelated accounts when an administrator deletes a user', async () => {
    const response = await adminAgent.delete(
      `/api/users/${secondUserId}`
    );

    expect(response.status).toBe(200);

    // The administrator and the other regular user must remain intact.
    const admin = await User.findById(adminId);
    const firstUser = await User.findById(firstUserId);
    const secondUser = await User.findById(secondUserId);

    expect(admin).not.toBeNull();
    expect(firstUser).not.toBeNull();
    expect(secondUser).toBeNull();
  });
});

import { beforeEach, describe, expect, test } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';

import app from '../../app.js';
import { createUser } from '../../src/models/users.js';
import User from '../../src/models/schemas/users.js';

const TEST_PASSWORD = 'Password123!';

describe('User Deletion API', () => {
    let adminId;
    let userOneId;
    let userTwoId;

    let adminAgent;
    let userOneAgent;
    let userTwoAgent;

    beforeEach(async () => {
        // Create three users.
        adminId = await createUser({
            displayName: 'Test Administrator',
            username: 'testadmin',
            email: 'admin@example.com',
            password: TEST_PASSWORD,
        });

        userOneId = await createUser({
            displayName: 'Test User One',
            username: 'testuserone',
            email: 'userone@example.com',
            password: TEST_PASSWORD,
        });

        userTwoId = await createUser({
            displayName: 'Test User Two',
            username: 'testusertwo',
            email: 'usertwo@example.com',
            password: TEST_PASSWORD,
        });

        // Promote the administrator to the admin role.
        await User.findByIdAndUpdate(adminId, {
            role: '2',
        });

        // Create independent agents to preserve separate sessions.
        adminAgent = request.agent(app);
        userOneAgent = request.agent(app);
        userTwoAgent = request.agent(app);

        // Authenticate each user.
        const adminLogin = await adminAgent
            .post('/login')
            .type('form')
            .send({
                email: 'admin@example.com',
                password: TEST_PASSWORD,
            });

        const userOneLogin = await userOneAgent
            .post('/login')
            .type('form')
            .send({
                email: 'userone@example.com',
                password: TEST_PASSWORD,
            });

        const userTwoLogin = await userTwoAgent
            .post('/login')
            .type('form')
            .send({
                email: 'usertwo@example.com',
                password: TEST_PASSWORD,
            });

        expect(adminLogin.status).toBe(302);
        expect(userOneLogin.status).toBe(302);
        expect(userTwoLogin.status).toBe(302);
    });

    test('should reject unauthenticated deletion requests', async () => {
        const response = await request(app)
            .delete(`/api/users/${userOneId}`);

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            error: 'Authentication required',
        });

        // The account must remain in the database.
        expect(await User.findById(userOneId)).not.toBeNull();
    });

    test('should allow an administrator to delete another user', async () => {
        const response = await adminAgent
            .delete(`/api/users/${userOneId}`);

        expect(response.status).toBe(200);
        expect(response.body._id).toBe(userOneId);
        expect(response.body.email).toBe('userone@example.com');
        expect(response.body).not.toHaveProperty('passwordHash');

        // Confirm the account was actually deleted.
        expect(await User.findById(userOneId)).toBeNull();

        // The administrator's session should remain active.
        const usersResponse = await adminAgent.get('/api/users');

        expect(usersResponse.status).toBe(200);
        expect(usersResponse.body.data).toHaveLength(2);
    });

    test('should prevent a regular user from deleting another user', async () => {
        const response = await userOneAgent
            .delete(`/api/users/${userTwoId}`);

        expect(response.status).toBe(403);
        expect(response.body).toEqual({
            message: 'You are not authorized to delete this user',
        });

        // Neither account should be deleted.
        expect(await User.findById(userOneId)).not.toBeNull();
        expect(await User.findById(userTwoId)).not.toBeNull();
    });

    test('should allow a regular user to delete their own account', async () => {
        const response = await userOneAgent
            .delete(`/api/users/${userOneId}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            message: 'Account deleted successfully. Session terminated.',
        });

        // Confirm the account no longer exists.
        expect(await User.findById(userOneId)).toBeNull();

        // The other user's account must remain.
        expect(await User.findById(userTwoId)).not.toBeNull();
    });

    test('should terminate the session after self-deletion', async () => {
        const deleteResponse = await userOneAgent
            .delete(`/api/users/${userOneId}`);

        expect(deleteResponse.status).toBe(200);

        // The same agent must no longer be authenticated.
        const subsequentResponse = await userOneAgent.get('/api/users');

        expect(subsequentResponse.status).toBe(401);
        expect(subsequentResponse.body).toEqual({
            error: 'Authentication required',
        });
    });

    test('should allow an administrator to delete their own account', async () => {
        const response = await adminAgent
            .delete(`/api/users/${adminId}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            message: 'Account deleted successfully. Session terminated.',
        });

        expect(await User.findById(adminId)).toBeNull();

        // The administrator's session should no longer work.
        const subsequentResponse = await adminAgent.get('/api/users');

        expect(subsequentResponse.status).toBe(401);
    });

    test('should reject an invalid user ID', async () => {
        const response = await adminAgent
            .delete('/api/users/not-a-valid-id');

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            message: 'Invalid user ID',
        });

        // Existing accounts must remain untouched.
        expect(await User.findById(userOneId)).not.toBeNull();
        expect(await User.findById(userTwoId)).not.toBeNull();
    });

    test('should return 404 when the user does not exist', async () => {
        const nonexistentId = new mongoose.Types.ObjectId().toString();

        const response = await adminAgent
            .delete(`/api/users/${nonexistentId}`);

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            message: 'User not found',
        });

        // Existing accounts must remain untouched.
        expect(await User.findById(userOneId)).not.toBeNull();
        expect(await User.findById(userTwoId)).not.toBeNull();
    });
});

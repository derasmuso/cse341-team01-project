# Test User Creation, Updating, and Deletion

Priority: High
API · CRUD · Data Integrity

## Title: Add Automated Tests for User Creation, Update, and Delete Operations

1. Objective
Implement automated tests for the API operations that create, modify, and delete users. Verify input validation, authorization, expected HTTP status codes, correct database changes, and protection of sensitive account information.
The tests must confirm that rejected requests do not accidentally create, modify, or delete database records.
2. Scope of work
A. Test user registration or creation
Use the existing registration or user-creation endpoint in the project.
1. Successful user creation
- Submit valid user data, including display name, username, email, and password.
- Verify the expected success status code and response structure.
- Retrieve the new record from the test database.
- Confirm that the record contains the expected public user information.
- Confirm that the password is stored as a hash, not as plaintext.
- Confirm that the new user receives the expected default role.
- Confirm that the API response does not contain the password or password hash.
2. Missing required fields
- Submit requests with each required field omitted, one scenario at a time.
- Verify that invalid submissions are rejected with the expected client-error status.
- Confirm that no user is created.
3. Invalid field values
- Test empty strings, malformed email addresses, and other invalid values covered by the application's validation rules.
- Verify that validation errors are returned consistently.
- Confirm that the database remains unchanged.
4. Duplicate username or email
- Create a user with a known username and email.
- Attempt to create another user with the same unique username or email.
- Verify that the duplicate request is rejected with the expected status code.
- Confirm that the original record remains unchanged and no duplicate record is created.
5. Password handling
- Verify that a valid password is hashed before persistence.
- Verify that the stored hash differs from the submitted plaintext password.
- Where appropriate, verify that the stored hash can be used by the application's password-verification function.
- Confirm that neither the password nor its hash appears in the response.
6. Authentication and registration permissions
- Test unauthenticated registration if public registration is supported.
- If the application restricts user creation to administrators, verify that regular users and unauthenticated clients cannot create users through the protected endpoint.
B. Test the update endpoint — PUT /api/users/:id
1. Administrator updates an authorized user
- Authenticate as an administrator.
- Update permitted fields for an existing user.
- Verify the expected success status and response structure.
- Retrieve the record from the database and confirm that the changes were persisted.
- Confirm that unrelated fields remain unchanged.
2. Regular user updates their own account
- Authenticate as a regular user.
- Update fields that regular users are allowed to modify.
- Verify that permitted changes are persisted.
- Confirm that restricted fields, including role or other administrative properties, cannot be changed by a regular user.
3. Regular user updates another user's account
- Authenticate as a regular user.
- Attempt to update another user's record.
- Verify that the request is rejected.
- Confirm that the target user's record remains unchanged.
4. Unauthenticated update
- Submit an update without valid authentication.
- Verify that the endpoint rejects the request.
- Confirm that the database record remains unchanged.
5. Invalid update data
- Test missing or invalid field values, malformed IDs, and unsupported update fields.
- Verify that invalid requests return the expected client-error status.
- Confirm that no unintended changes are persisted.
6. Duplicate email during update
- Create at least two users.
- Attempt to change one user's email to the other user's email.
- Verify that the request is rejected.
- Confirm that both users retain their original email addresses.
7. Password update
- Submit a valid password change through the supported update mechanism.
- Confirm that the database stores a new password hash rather than plaintext.
- Verify that the old password no longer passes verification and the new password does, if this is the application's intended behavior.
- Confirm that the response contains no password or password hash.
8. Nonexistent user
- Attempt to update a validly formatted ID that does not exist.
- Verify that the endpoint returns the expected not-found status code.
C. Test the delete endpoint — DELETE /api/users/:id
1. Administrator deletes an authorized user
- Authenticate as an administrator.
- Delete an existing user within the administrator's scope.
- Verify the expected success status and response.
- Confirm that the user record no longer exists in the database.
- Confirm that the administrator's own account and session remain intact.
2. Regular user deletes their own account
- Authenticate as a regular user.
- Delete their own account.
- Verify the expected success response.
- Confirm that the user record has been removed.
- Verify that the user's session is destroyed and the session cookie is cleared, where applicable.
3. Regular user deletes another user's account
- Authenticate as a regular user.
- Attempt to delete another user's record.
- Verify that the request is rejected.
- Confirm that the target record still exists.
4. Unauthenticated deletion
- Attempt deletion without valid authentication.
- Verify that the request is rejected.
- Confirm that the target record remains in the database.
5. Nonexistent or invalid user ID
- Test both malformed IDs and validly formatted IDs that do not exist.
- Verify the appropriate client-error or not-found response.
6. Repeated deletion
- Delete a user successfully, then attempt to delete the same ID again.
- Verify that the second request returns the expected not-found response rather than reporting another successful deletion.
3. Database verification requirements
Tests must check the database after every important write operation.
- Creation tests verify record existence, default role, and password hashing.
- Update tests verify changed fields and preservation of unrelated fields.
- Rejected updates verify that the original record remains unchanged.
- Deletion tests verify record absence.
- Duplicate-value tests verify that unique records are preserved.
- Authentication tests verify that protected operations cannot be performed without valid credentials.
Use the project's existing database test setup and cleanup strategy. If a temporary database is already configured, reuse it rather than introducing another database system.
4. Acceptance criteria
- [ ] Valid creation requests persist the correct records.
- [ ] Invalid creation requests do not create records.
- [ ] Passwords are hashed and never returned in API responses.
- [ ] Update authorization is enforced for administrators and regular users.
- [ ] Restricted fields cannot be changed by unauthorized users.
- [ ] Duplicate values and invalid updates are handled correctly.
- [ ] Delete operations remove the intended records only.
- [ ] Self-deletion terminates the user's session where applicable.
- [ ] Unauthorized and failed operations leave database records unchanged.
- [ ] Tests assert both response status codes and database state.
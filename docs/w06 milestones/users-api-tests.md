# Feature Set 2: Users API

Add automated tests for /api/users and its related user endpoints.

- Read tests: Test the endpoint that returns users and the endpoint that returns one user. Verify the behavior for an administrator and a standard signed-in user. Confirm that API responses do not expose password hashes or other private authentication data.
- Write tests: Test the existing user creation or registration behavior and the API operations that update and delete users. Verify authorized and unauthorized behavior, response status codes, and the resulting records in the temporary database.
- Pagination and search tests: Test user pagination, role filtering, and keyword search across display names, usernames, or email addresses. Verify the result data and pagination metadata, including a request that returns no matches.


## Objective
Add automated tests for the Users API to verify endpoint functionality, authorization, data privacy, and pagination, filtering, and search behavior.

## Scope
- Test user retrieval and authentication-based access control.
- Test user creation, updating, and deletion, including database changes.
- Test pagination, role filtering, and keyword search.
- Use Vitest, Supertest, and a temporary MongoDB database.

## Acceptance Criteria
- All tests run automatically and produce repeatable results.
- Authorized and unauthorized requests return the expected HTTP status codes.
- API responses never expose password hashes or other private authentication data.
- Database changes and pagination metadata are verified.
- Existing application behavior remains unchanged.
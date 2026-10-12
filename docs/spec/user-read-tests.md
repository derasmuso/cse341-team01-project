# Test User Retrieval Endpoints and Access Control

Priority: High
API · Authorization · Security

## Title: Add Automated Tests for User Retrieval and Access Control

1. Objective
Create automated tests for the endpoints responsible for retrieving user information. Verify that administrators can retrieve only the users they are authorized to manage, while regular authenticated users can retrieve only their own information where required by the API's access rules.
The tests must also confirm that private authentication data is excluded from every user response.
2. Scope of work
A. Test the user list endpoint — GET /api/users
Implement tests for the following scenarios:
1. Administrator retrieves users
- Authenticate as an administrator.
- Send a request to GET /api/users.
- Verify that the response uses the expected success status code.
- Verify that the returned users match the administrator's permitted scope.
- Verify that the response contains the expected user properties.
- Confirm that passwordHash is absent from every returned user.
2. Regular user retrieves users
- Authenticate as a regular user.
- Send a request to GET /api/users.
- Verify that the response contains only the authenticated user's information, according to the endpoint's authorization contract.
- Confirm that other users' information is not included.
- Confirm that sensitive authentication fields are absent.
3. Unauthenticated request
- Send the request without a valid authenticated session or token, according to the application's authentication mechanism.
- Verify that the request is rejected with the expected status code.
- Confirm that no user records are disclosed.
4. Administrator with restricted access
- Create users inside and outside the administrator's authorized scope, if the application supports scoped administration.
- Verify that the response includes only permitted users.
- Confirm that users outside that scope cannot be retrieved through the list endpoint.
5. Empty user collection
- Arrange a test database with no users in the relevant scope.
- Verify that the endpoint returns the expected empty result structure.
- Confirm that the response does not produce an unexpected server error.
B. Test the individual user endpoint
Test the endpoint responsible for retrieving a user by ID, such as GET /api/users/:id, using the actual route defined in the project.
1. Administrator retrieves an authorized user
- Authenticate as an administrator.
- Request an existing user within the administrator's scope.
- Verify the status code and returned user's identity and properties.
- Confirm that sensitive fields are excluded.
2. Regular user retrieves their own information
- Authenticate as a regular user.
- Request their own user ID.
- Verify that the response contains the correct user.
3. Regular user requests another user's information
- Authenticate as a regular user.
- Request a different user's ID.
- Verify that access is denied or that the endpoint returns the contractually defined not-found response.
- Confirm that the other user's information is not disclosed.
4. User does not exist
- Request a validly formatted ID that does not correspond to a database record.
- Verify that the endpoint returns the expected not-found status code.
5. Invalid user ID
- Request the endpoint using a malformed ID.
- Verify that the application returns the expected client-error status rather than an unhandled server error.
C. Verify response privacy
For both retrieval endpoints, verify that responses never expose:
- passwordHash
- Plaintext passwords, if any are present in request data
- Password-reset tokens or authentication secrets, if the application stores them
- Session tokens or other private authentication fields
Check both top-level user objects and objects nested in response structures.
3. Test data and isolation
- Create dedicated administrator and regular-user accounts in the test database.
- Create additional users to verify access boundaries.
- Assign roles using the application's actual role model and database relationships.
- Authenticate requests through the same middleware and session or token mechanism used by the application.
- Ensure tests do not depend on records from a development or production database.
- Reset or clean up test data between tests or test suites.
4. Acceptance criteria
- [ ] Administrator retrieval returns only authorized users.
- [ ] Regular-user retrieval follows the self-access rule.
- [ ] Individual-user retrieval enforces authorization.
- [ ] Unauthenticated requests are rejected.
- [ ] Invalid IDs and missing users return the expected status codes.
- [ ] No response exposes password hashes or private authentication data.
- [ ] Empty results have the expected response structure.
- [ ] Tests verify both HTTP responses and the actual identity of returned records.
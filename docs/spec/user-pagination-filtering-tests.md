# Test User Pagination, Role Filtering, and Keyword Search

Priority: High
API · Filtering · Pagination

## Title: Add Automated Tests for User List Pagination, Filtering, and Search

1. Objective
Create automated tests for the user-list API's pagination, role filtering, and keyword search functionality. Verify that each request returns the correct records, respects the requested page size and filters, and provides accurate pagination metadata.
The tests must also cover empty results, invalid query parameters, combined filters, and protection of sensitive user information.
2. Scope of work
A. Test default pagination
1. Default query parameters
   - Create more users than the default page size.
   - Request GET /api/users without pagination parameters.
   - Verify that the default page is returned.
   - Verify that the default page size is 10, if that is the API's defined default.
   - Confirm that the result contains no more than 10 users.
   - Verify that the pagination metadata reports the correct page, limit, total item count, total pages, and navigation flags.
2. First page
   - Request page 1 with a specified limit.
   - Verify that the returned records match the expected sorted records.
   - Confirm that hasPreviousPage is false.
   - Confirm that hasNextPage is true when more records remain.
3. Middle page
   - Create enough records to populate at least three pages.
   - Request a page between the first and last pages.
   - Verify that the returned records belong to the requested page and do not duplicate records from other pages.
   - Confirm that both navigation flags are true when applicable.
4. Last page
   - Request the final page of a multi-page result set.
   - Verify that the returned records match the remaining expected records.
   - Confirm that hasNextPage is false.
   - Confirm that hasPreviousPage is true when earlier pages exist.
5. Page beyond the last page
   - Request a page number greater than the total number of pages.
   - Verify the API's documented behavior for out-of-range pages.
   - If the API returns an empty result, confirm that the response structure and metadata remain correct.
6. Page-size options
   - Test each supported page size: 10, 25, 50, and 100.
   - Verify that the result contains no more than the requested number of users.
   - Confirm that the returned limit matches the requested value.
   - Verify that the total item count remains consistent across page-size changes.
B. Test pagination validation and metadata
1. Test page values that are zero, negative, non-numeric, or otherwise invalid.
2. Test limit values that are zero, negative, non-numeric, or above the allowed maximum.
3. Verify the API's expected validation behavior for unsupported limits.
4. Confirm that invalid query parameters produce a controlled client-error response rather than an internal server error.
5. Verify that totalPages equals the total matching record count divided by the page size, rounded up.
6. Verify that hasNextPage and hasPreviousPage reflect the requested page and actual result count.
7. Verify that an empty result set returns totalItems: 0, totalPages: 0, and appropriate navigation flags, according to the API contract.
C. Test role filtering
1. Filter by an existing role
   - Create users assigned to at least two different roles.
   - Request the user list with a role filter.
   - Verify that every returned user has the requested role.
   - Confirm that the total count reflects only matching users.
2. Filter by another role
   - Repeat the test with a different role.
   - Verify that users from the first role are excluded.
3. Filter with no matching users
   - Request a valid role that has no matching users in the authorized scope.
   - Verify that the result is empty.
   - Confirm that the metadata reports zero matching items and zero total pages.
4. Invalid role filter
   - Submit an invalid or unsupported role value.
   - Verify the expected validation behavior.
   - Confirm that the API does not silently return unrelated users if the request is invalid.
5. Role filter with pagination
   - Create enough users within one role to fill multiple pages.
   - Request successive pages using that role filter.
   - Verify that every returned user matches the role and that the pagination metadata reflects only the filtered result set.
D. Test keyword search
The search parameter q must be tested against the three supported fields: displayName, username, and email.
1. Search by display name
   - Create users with distinctive display names.
   - Search for a term appearing in one or more display names.
   - Verify that the matching users are returned and unrelated users are excluded.
2. Search by username
   - Search for a distinctive username fragment.
   - Verify that the matching user is included.
3. Search by email
   - Search for a distinctive email address or fragment.
   - Verify that the correct matching users are returned.
4. Partial keyword matching
   - Search using part of a display name, username, or email.
   - Verify that partial matches are returned if the API supports substring matching.
5. Case-insensitive search
   - Search with uppercase, lowercase, and mixed-case versions of a known keyword.
   - Verify that case variations return equivalent results when search is intended to be case-insensitive.
6. Search with no matches
   - Submit a keyword that does not appear in any searchable field.
   - Verify that the response contains an empty data array and accurate zero-result metadata.
7. Search special characters
   - Submit a keyword containing regular-expression metacharacters, such as ., *, or +.
   - Verify that the search behaves as a literal keyword search if the implementation escapes regular-expression characters.
   - Confirm that such input does not cause an error or unintentionally match unrelated users.
8. Empty or omitted keyword
   - Request the list without q, and with an empty q if supported.
   - Verify that the endpoint returns the unsearched result set for the user's authorized scope.
E. Test combined filters and search
1. Role plus keyword
   - Create users with overlapping and non-overlapping role and search criteria.
   - Submit a request containing both filters.
   - Verify that every result satisfies both conditions.
2. Role plus pagination
   - Apply a role filter and request multiple pages.
   - Verify that only matching users are paginated.
3. Keyword plus pagination
   - Search for a term that matches more records than one page can hold.
   - Verify that pages contain the correct subsets of matching users without duplicates.
4. Role, keyword, and pagination together
   - Submit all supported parameters in one request.
   - Verify that returned users satisfy the role and keyword criteria and belong to the requested page.
   - Confirm that totalItems and totalPages describe the combined filtered result set, not the unfiltered collection.
5. No results after combining filters
   - Submit valid filters that individually match records but have no intersection.
   - Verify that the result is empty and the metadata reflects zero matches.
F. Test sorting and result consistency
If sorting is supported by the endpoint:
- Verify the default sort field and order.
- Test ascending and descending order for each permitted sort field.
- Confirm that records with equal sort values are returned consistently when the implementation uses a tie-breaker.
- Verify that unsupported sort fields or order values are rejected.
- Confirm that pagination does not produce unexpected duplicate or missing records when records have equal sort values.
G. Test access control and response privacy with filters
- Verify that regular users cannot use pagination, role filters, or search parameters to retrieve other users' records if their access rule restricts them to their own information.
- Verify that administrators receive only records within their authorized scope, including when filters are applied.
- Confirm that all paginated and filtered responses exclude passwordHash and other private authentication fields.
3. Test data and expected results
Use a deterministic dataset with enough users to cover:
- More than 100 records for page-size and multi-page tests.
- Multiple roles, with different numbers of users per role.
- Unique searchable terms in display names, usernames, and emails.
- Several records sharing a search keyword.
- Search terms that match no records.
- Records with overlapping role and search criteria.
- Equal sort values, if sorting is supported.
Build expected results from the seeded test data rather than assuming a particular database insertion order. Where sorting is defined, calculate the expected order using the same documented sort rules, including any tie-breaker.
4. Expected response structure
For successful paginated list requests, verify the API returns the documented structure, such as:
{
  "data": [
    {
      "_id": "example-user-id",
      "displayName": "Example User",
      "username": "exampleuser",
      "email": "example@example.com",
      "role": "customer"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalItems": 35,
    "totalPages": 4,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}


The values above are illustrative. Tests must assert the actual role representation and response schema used by the project.
5. Acceptance criteria
- [ ] Default pagination returns the correct page size and metadata.
- [ ] Supported page sizes return the expected number of records.
- [ ] First, middle, last, and out-of-range pages behave as specified.
- [ ] Invalid pagination parameters are handled consistently.
- [ ] Role filters return only matching users and correct counts.
- [ ] Search works across displayName, username, and email.
- [ ] Search behavior is correct for partial matches and letter case.
- [ ] Special-character searches behave safely and predictably.
- [ ] Combined filters and pagination return the correct intersection of records.
- [ ] Zero-match results return an empty array and accurate metadata.
- [ ] Sorting tests cover the supported sort fields and orders.
- [ ] Authorization remains enforced when filters are applied.
- [ ] No filtered or paginated response exposes private authentication data.
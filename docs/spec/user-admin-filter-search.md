# Issue: Add User Search and Role Filtering

## Objective

Enhance the existing `GET /api/users` endpoint and `/users` page by adding:

* Keyword search across user display names, usernames, and email addresses.
* Filtering by user role.
* Support for combining search and role filtering.
* Pagination of the resulting filtered/search results.

The pagination functionality from PR 1 must remain available and continue to work with the new search and filtering functionality.

---

## API Endpoint

**Endpoint:**

`GET /api/users`

The endpoint must continue to support the pagination and sorting parameters introduced in PR 1.

### Query Parameters

| Parameter | Type          | Default    | Description                                             |
| --------- | ------------- | ---------- | ------------------------------------------------------- |
| `q`       | string        | none       | Keyword used to search display name, username, or email |
| `role`    | number/string | none       | Filters users by their role                             |
| `page`    | number        | `1`        | Page number                                             |
| `limit`   | number        | `10`       | Number of users returned per page                       |
| `sort`    | string        | `username` | Field used to sort the results                          |
| `order`   | string        | `asc`      | Sort direction                                          |

Example:

`GET /api/users?q=john&role=1&page=1&limit=10`

---

## Keyword Search

The `q` parameter must search across the following user fields:

* `displayName`
* `username`
* `email`

The search should be **case-insensitive**.

For example:

`GET /api/users?q=john`

should return users where `john` matches any of the supported fields.

The search should support partial matches. For example, searching for `jo` may match:

* `John Doe`
* `johnsmith`
* `john@example.com`

The search input should be trimmed and validated before being used in the database query.

A search term should have a reasonable maximum length, such as **100 characters**, to prevent unnecessarily large requests.

---

## Role Filtering

The `role` parameter must restrict the results to users with the requested role.

The filter must use the application's existing role values.

For example:

`GET /api/users?role=1`

should return only users belonging to role `1`.

The implementation must not introduce new role values or change the existing role system.

---

## Combining Search and Role Filtering

The search and role filter must be usable together.

For example:

`GET /api/users?q=john&role=1`

should return only users who:

1. Match `john` in their display name, username, or email; **and**
2. Have the requested role.

The pagination metadata must be calculated from this combined result set.

---

## Pagination

The existing pagination behavior from PR 1 must remain unchanged.

The default behavior should continue to be:

* Page: `1`
* Limit: `10`
* Sort: `username`
* Order: `asc`

For example:

`GET /api/users?q=john&page=2&limit=10`

must return the second page of users matching the search term.

The response must continue to include:

```json
{
  "data": [],
  "pagination": {
    "page": 2,
    "limit": 10,
    "totalItems": 25,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": true
  }
}
```

`totalItems` and `totalPages` must represent the **filtered/search result set**, not the total number of users in the database.

---

## No-Match Results

A valid search or role filter that produces no matches must return:

* HTTP `200`
* An empty `data` array
* Correct pagination metadata

It must **not** return `404`.

Example:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalItems": 0,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

---

## Validation

The controller must validate query parameters before passing them to the model.

Invalid values should return **HTTP `400`** with a clear error message.

Validation should include:

* Invalid `page`.
* Invalid `limit`.
* Invalid `sort`.
* Invalid `order`.
* Invalid `role`.
* Invalid or excessively long search input.

The implementation should not pass the entire `req.query` object directly to Mongoose.

Only supported and validated query parameters should be used to construct the database query.

---

## User Interface

Update the existing `/users` page to provide controls for searching and filtering.

The page should include:

### Search

A keyword input that allows the administrator to search by:

* Display name
* Username
* Email

### Role Filter

A role selection control that allows the administrator to filter users by their available roles.

### Results

The existing user table/list should display the results returned by the API.

The page must continue displaying users **10 at a time**.

### Pagination Controls

The existing pagination controls from PR 1 must continue to work.

When the administrator changes the search term or role filter:

* The results should be refreshed.
* Pagination should start from page 1.
* The selected search/filter criteria should be included in the API request.

When moving to another page, the current search and role filter must be preserved.

For example, after searching for `john` and selecting role `1`, clicking **Next** should request the next page while retaining:

`q=john&role=1`

---

## API Request Examples

### All Users

`GET /api/users`

Returns the first 10 users sorted by username.

### Search

`GET /api/users?q=john`

Returns users matching `john`.

### Role Filter

`GET /api/users?role=1`

Returns users belonging to role `1`.

### Search + Role Filter

`GET /api/users?q=john&role=1`

Returns users matching `john` who also have role `1`.

### Search + Pagination

`GET /api/users?q=john&page=2&limit=10`

Returns the second page of matching users.

### Search + Role + Pagination

`GET /api/users?q=john&role=1&page=2&limit=10`

Returns the second page of users matching the search and role criteria.

---

## Swagger Documentation

Update the Swagger/OpenAPI documentation for `GET /api/users`.

Document:

* `q`
* `role`
* `page`
* `limit`
* `sort`
* `order`

For each parameter, document:

* Parameter type.
* Whether it is required.
* Default value where applicable.
* Allowed values where applicable.
* Validation constraints.
* Purpose of the parameter.

The response documentation should also describe the `data` and `pagination` properties.

---

## Testing Requirements

Tests should verify at minimum:

### Search

* Search by display name.
* Search by username.
* Search by email.
* Case-insensitive search.
* Partial keyword matches.
* Search with no matches.

### Role Filter

* Filtering by each valid role.
* Invalid role value.
* Role filter with no matching users.

### Combined Search and Filter

* Search + role filter.
* Search + role filter + pagination.
* Correct `totalItems` and `totalPages` after filtering.

### Pagination

* First page.
* Subsequent pages.
* Previous/next page behavior.
* Pagination after applying a search.
* Pagination after applying a role filter.
* Pagination after applying both.

### Validation

* Invalid page.
* Invalid limit.
* Invalid sort.
* Invalid order.
* Invalid role.
* Invalid/oversized search input.

### UI

* Search control works.
* Role filter works.
* Search and filter can be combined.
* Pagination preserves the current search/filter criteria.
* Changing search/filter resets the results to page 1.

---

## Security and Existing Behavior

The existing authentication and authorization rules must remain unchanged.

The endpoint must continue to enforce the existing user-management permissions.

User password hashes must never be included in the API response.

No changes should be made to user creation, authentication, password handling, or role assignment as part of this issue.

---

## Out of Scope

This issue does not include:

* Creating new user roles.
* Changing the existing role system.
* Changing authentication or authorization.
* Changing user creation, update, or deletion behavior.
* Changing the pagination response structure introduced in PR 1.
* Adding unrelated user-management features.

---

## Definition of Done

This issue is complete when:

* `GET /api/users` supports keyword search.
* Search covers display name, username, and email.
* Search is case-insensitive and supports partial matches.
* Role filtering works with the existing role values.
* Search and role filtering can be combined.
* Pagination works correctly with all search/filter combinations.
* Pagination metadata reflects the filtered result set.
* Valid no-match requests return `200` with an empty result.
* Invalid query parameters return `400`.
* The `/users` page provides search and role-filter controls.
* Pagination preserves active search/filter criteria.
* Swagger documentation is updated.
* Appropriate tests pass.
* ESLint reports no errors.
* Existing authentication, authorization, and password-protection behavior remains intact.

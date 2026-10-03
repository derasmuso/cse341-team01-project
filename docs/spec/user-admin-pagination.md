## Issue — Implement Pagination for User List

### Objective

Implement pagination for the `GET /api/users` endpoint and update the `/users` page to display the results 10 users at a time.

### API Requirements

Update `GET /api/users` to support the following query parameters:

| Parameter | Default    | Description                      |
| --------- | ---------- | -------------------------------- |
| `page`    | `1`        | Page number to retrieve          |
| `limit`   | `10`       | Number of users per page         |
| `sort`    | `username` | Field used to sort the results   |
| `order`   | `asc`      | Sort direction (`asc` or `desc`) |

The default request:

`GET /api/users`

must return the first 10 users sorted by username in ascending order.

### Response Requirements

The API response must include:

* The users in a `data` array.
* A `pagination` object containing:

  * `page`
  * `limit`
  * `totalItems`
  * `totalPages`
  * `hasNextPage`
  * `hasPreviousPage`

The `totalItems` and `totalPages` values must represent the complete user list, not only the current page.

If a valid page contains no users, return `200` with an empty `data` array and the appropriate pagination metadata.

### Validation

* `page` must be a positive integer.
* `limit` must be a positive integer and must not exceed the API's defined maximum.
* `sort` must use a supported user field.
* `order` must be either `asc` or `desc`.
* Invalid values must return `400` with a clear error message.

### User Interface

Update the `/users` page to:

* Display a maximum of 10 users at a time.
* Display the current page of results.
* Provide **Previous** and **Next** controls.
* Disable or hide Previous on the first page.
* Disable or hide Next on the last page.
* Request the appropriate page from `GET /api/users` when navigating.
* Preserve the default username sorting.

### Database and Code Structure

* Apply pagination at the database/model level using the appropriate skip/limit operations.
* Keep HTTP request/response handling in the controller.
* Do not pass the raw query object directly to the database.
* Preserve the existing authentication and authorization requirements for `/api/users`.

### Documentation and Testing

* Update Swagger to document `page`, `limit`, `sort`, and `order`, including their defaults and valid values.
* Test the default request, different pages, sorting, page boundaries, invalid parameters, and pagination metadata.
* Verify the `/users` pagination controls work correctly.
* Run ESLint and ensure there are no errors.

### Out of Scope

Keyword search and role filtering will be implemented separately in PR 2.

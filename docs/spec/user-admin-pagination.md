# Issue: Implement Admin User Pagination with Sorting and Modal Editing

## Goal

Implement pagination for the admin Users page so administrators can browse users in groups of 10. Display users in a sortable table with modal-based editing, while keeping the page content in the dashboard's main content area beside the sidebar.

## 1. Dashboard Layout

- Keep navigation links in the existing sidebar.
- Display the Users page content in the wider main content area.
- Preserve the existing dashboard layout and navigation functionality.

## 2. Paginated Users API

Update `GET /api/users` to support:

- `page`: Page number; default `1`, must be a positive integer.
- `limit`: Number of users per page; default `10`, must be a positive integer and respect the API's maximum limit.
- `sort`: Supported user field; default `username`.
- `order`: Sort direction; default `asc`, allowed values are `asc` and `desc`.

### Response

Return a structured response containing:

- `data`: Users for the requested page.
- `pagination.page`: Current page.
- `pagination.limit`: Page size.
- `pagination.totalItems`: Total number of authorized users.
- `pagination.totalPages`: Total number of pages.
- `pagination.hasNextPage`: Whether another page exists.
- `pagination.hasPreviousPage`: Whether a previous page exists.

### API requirements

- Apply pagination and sorting at the database/model level.
- Calculate the total authorized user count independently of the current page results.
- Return HTTP `200` with an empty data array for a valid page with no results.
- Return HTTP `400` with a clear error message for invalid query parameters.
- Validate sort fields against an explicit allowlist.
- Preserve existing authentication and authorization rules.
- Never expose `passwordHash`.

## 3. Sortable Users Table

- Display a maximum of 10 users per page by default.
- Show relevant user fields, including display name, username, email, and role, subject to existing permissions.
- Allow sorting by supported fields.
- Use username ascending as the default sort order.
- Preserve the selected sort order when navigating between pages.
- Keep the table and pagination controls in the main content area.

## 4. Pagination Controls

- Add **Previous** and **Next** controls below the table.
- Disable or hide Previous on the first page.
- Disable or hide Next on the last page.
- Fetch the correct users when the page changes.
- Display accurate pagination metadata.
- Preserve the selected sorting options when changing pages.

## 5. Modal-Based User Editing

- Add an Edit button for each user row.
- Clicking Edit opens a popup prefilled with that user's editable information.
- Provide Save Changes and Cancel actions.
- Validate submitted data and display useful error messages.
- On successful save, update the corresponding table row without a full page reload.
- Preserve the current page and sort settings after saving.
- Cancel closes the popup and discards unsaved changes.
- Enforce existing authorization rules on the server.

## 6. Swagger and Testing

Update Swagger/OpenAPI documentation for the pagination and sorting parameters, defaults, validation rules, and response structure.

Test that:

- The API returns 10 users by default.
- Pagination, sorting, and metadata are correct.
- Invalid parameters return HTTP `400`.
- First-page and last-page controls behave correctly.
- Modal editing saves valid changes and reflects them in the table.
- Cancel discards unsaved changes.
- Existing authorization is preserved and password hashes are never exposed.
- Existing tests pass and ESLint reports no new issues.

## Acceptance Criteria

1. The API supports validated pagination and sorting.
2. The Users table displays 10 users per page by default.
3. Previous and Next navigate correctly and respect page boundaries.
4. Sorting works with pagination.
5. User editing works through a popup without requiring a full page reload.
6. The Users page fits into the existing dashboard layout.
7. API documentation, tests, and linting are updated or verified.

## Out of Scope

- Profile page editing.
- Role filtering and keyword search.
- Bulk user operations.
- Other dashboard redesigns or unrelated features.

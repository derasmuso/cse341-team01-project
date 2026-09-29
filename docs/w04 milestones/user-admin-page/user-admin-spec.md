Feature Set 3 — Protected User Admin Page
# Issue 1 — Create protected user admin page

Goal: Create the user administration page and enforce authentication.

Tasks

Create the /admin/users page and EJS view.
Protect the page with the existing authentication middleware.
Redirect unauthenticated users to /login.
Add the user list container and HTML templates for:
user cards
user edit forms
Add the page to the admin dashboard.

Acceptance Criteria

Unauthenticated users are redirected to /login.
Authenticated users can access /admin/users.
The page contains the required user list and templates.
The admin dashboard links to /admin/users.

# Issue 2 — Implement user management API

Goal: Provide the API operations required by the user admin page.

Tasks

Add model functions for retrieving, updating, and deleting users.
Implement GET /api/users.
Admins receive all users.
Non-admin users receive only their own information.
Implement PUT /api/users/:id.
Implement DELETE /api/users/:id.
Return safe user data without passwordHash.
Handle invalid IDs, missing users, validation errors, and server errors appropriately.

Acceptance Criteria

GET /api/users returns users according to the authenticated user's role.
Authorized users can update their own information.
Admins can update any user.
Authorized users can delete their own account.
Admins can delete any user.
Database logic remains in the model.

# Issue 3 — Secure user management operations

Goal: Ensure users cannot use the API to access or modify unauthorized accounts.

Tasks

Apply authentication to the user API.
Allow users to update/delete only their own account.
Allow admins to update/delete any account.
Return:
401 for unauthenticated requests.
403 for authenticated users without permission.
400 for invalid input/IDs.
404 when the requested user does not exist.
Only allow approved fields to be updated.
Prevent non-admin users from changing protected fields such as their role, if applicable.
Never expose password hashes.

Acceptance Criteria

Not authenticated → 401
User → own account → allowed
User → another account → 403
Admin → any account → allowed

Authorization must be enforced on the server and must not depend on client-side JavaScript.

# Issue 4 — Implement dynamic user management UI

Goal: Build the client-side interaction for viewing, editing, and deleting users without page refreshes.

Tasks

Load users with GET /api/users.
Store users in a JavaScript Map.
Render users using the HTML templates.
Use textContent for API-provided values.
Use event delegation for Edit, Cancel, and Delete actions.
Replace the selected user card with the edit form.
Send PUT /api/users/:id when saving.
Send DELETE /api/users/:id when deleting.
Update the local Map from successful API responses.
Re-render the list after updates or deletions.
Display success and error messages.
Do not use window.location.reload().

Acceptance Criteria

Admins see all users returned by the API.
Non-admin users see only themselves.
Edit affects only the selected card.
Cancel makes no API request.
Successful updates appear immediately.
Successful deletions remove the user immediately.
No page refresh is required.
# Issue 5 — Test Feature Set 3

Goal: Verify authentication, authorization, API operations, and client-side behavior.

Tasks

Test unauthenticated page access.
Test admin and non-admin user visibility.
Test authorized and unauthorized updates.
Test authorized and unauthorized deletions.
Test invalid IDs and missing users.
Test dynamic edit, save, cancel, and delete interactions.
Verify the list updates without a page refresh.

Acceptance Criteria

Authentication and authorization rules are enforced.
CRUD operations behave according to the specification.
The UI reflects successful API changes immediately.
No full-page reload is required after update/delete.
# Final issue structure

##	Issue	Main responsibility
1	Create protected user admin page	Page, authentication, templates, dashboard link
2	Implement user management API	Model, controller, routes, CRUD
3	Secure user management operations	Ownership/admin authorization
4	Implement dynamic user management UI	Fetch, templates, edit, update, delete
5	Test Feature Set 3	End-to-end verification

This is the structure I'd use for the team's GitHub board: 5 issues, with each issue representing a substantial, independently understandable piece of the feature set.
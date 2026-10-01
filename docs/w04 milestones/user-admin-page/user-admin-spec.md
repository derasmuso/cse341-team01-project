# Feature Set 3 — User Management
## Issue 1 — Implement Role-Based Dashboards and User Profile

### Goal

Create separate dashboards for regular users and administrators, along with a protected profile page for authenticated users.

### Requirements
1. Create/protect GET /dashboard.
Requires authentication.
Regular users are directed to the regular user dashboard.
Admin users are directed to /admin/dashboard.

2. Create/protect the regular user dashboard.
Accessible only to authenticated non-admin users.
Display regular user features.

3. Keep/create the admin dashboard at GET /admin/dashboard.
Accessible only to authenticated administrators.
Display administrative features.

4. Create/protect GET /profile.
Accessible to authenticated users.
Display only the authenticated user's information.
Do not use a user ID supplied in the URL to determine whose profile is displayed.
Add appropriate navigation links.
Regular users can access their dashboard and profile.
Administrators can access their dashboard, profile, and administration features.
Admin dashboard includes a link to /admin/users.

### Acceptance criteria
1. An unauthenticated user accessing /dashboard or /profile is redirected to /login.

2. A regular user can access the regular dashboard and their own profile.

3. An admin can access the admin dashboard and their own profile.

4. A regular user cannot access /admin/dashboard.

5. A regular user cannot access /admin/users.

6. An admin can access /admin/dashboard and /admin/users.

7. A user can only view their own profile.


## Issue 2 — Implement User Management API
Goal

Create the API operations required to retrieve, update, and delete users.

Requirements
Create the necessary user model functions.
Create the necessary controller functions.
Implement:
GET /api/users
PUT /api/users/:id
DELETE /api/users/:id
GET /api/users:
Admin → return users they are authorized to manage.
Regular user → return only their own information.
Never expose passwordHash.
Validate IDs and request data.
Return appropriate HTTP status codes.
Acceptance criteria
Valid requests return the expected data.
Sensitive fields are excluded.
Invalid data returns 400.
A missing user returns 404.
Server errors return 500.

## Issue 3 — Secure User Management Operations
Goal

Ensure users can only perform operations they are authorized to perform.

Requirements
Require authentication for all user-management API operations.
A regular user can update their own information.
A regular user can delete their own account.
A regular user cannot update another user's information.
A regular user cannot delete another user's account.
An admin can update any user.
An admin can delete any user.
Prevent regular users from changing protected fields such as role.
Enforce authorization on the server, regardless of what the UI displays.
Acceptance criteria
Unauthenticated requests → 401.
Authenticated but unauthorized requests → 403.
Regular users cannot elevate their privileges.
Admins can manage other users.
Users can manage their own permitted information.
Issue 4 — Implement Dynamic User Management UI
Goal

Allow administrators to manage users without refreshing the page.

Requirements
Create the /admin/users page.
Load users dynamically through GET /api/users.
Render users using HTML templates.
Maintain loaded users in a Map keyed by user ID.
Implement edit functionality.
Implement cancel functionality.
Implement delete functionality.
Use PUT /api/users/:id for updates.
Use DELETE /api/users/:id for deletion.
Update the local Map and DOM after successful operations.
Do not use window.location.reload().
Safely render user-provided values using textContent.
Acceptance criteria
Administrators see the appropriate users after loading the page.
Users can be edited without a page refresh.
Users can be deleted without a page refresh.
Canceling an edit restores the user card.
The UI reflects successful API operations immediately.
Issue 5 — Test Feature Set 3
Goal

Verify authentication, authorization, dashboards, profiles, APIs, and dynamic user management.

Requirements

Test:

Unauthenticated dashboard access.
Regular user dashboard access.
Admin dashboard access.
Regular user access to /admin/dashboard.
Regular user access to /admin/users.
User profile access.
Profile isolation.
GET /api/users.
User update.
User deletion.
Unauthorized update/delete attempts.
Admin update/delete operations.
Invalid IDs and invalid data.
Client-side update/delete without page reload.
Acceptance criteria

The complete Feature Set 3 behavior works according to the requirements above, with authentication and authorization enforced both at the page and API levels.

Final architecture
                         Authentication
                               │
                ┌──────────────┴──────────────┐
                │                             │
             Customer                        Admin
                │                             │
                ▼                             ▼
          /dashboard                  /admin/dashboard
                │                             │
                └──────────────┬──────────────┘
                               │
                            /profile
                         Own profile only

                               │
                               ▼
                         /admin/users
                            Admin only

This version keeps Issue 1 focused on pages and role-based access, Issues 2–3 on the API/security, Issue 4 on the client-side UI, and Issue 5 on testing. It also fits your existing requirePageLogin and requirePageRole('admin') middleware without requiring us to redesign your authentication system.
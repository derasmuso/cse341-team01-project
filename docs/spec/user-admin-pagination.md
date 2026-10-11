## Issue: Integrate User Management Pagination into a Reusable Dashboard Layout

### Description

Integrate the paginated user management page into a reusable, role-aware dashboard layout shared by administrators and regular users. The layout should provide consistent navigation and a dashboard header displaying the authenticated user's name and role, while preserving existing user management functionality.

### Requirements

1. Create a reusable dashboard layout with a shared header, sidebar, dashboard header, content area, and footer.
2. Display the authenticated user's name and role in the dashboard header.
3. Integrate the user management page into the shared layout without breaking pagination, sorting, editing, or deletion.
4. Use the same dashboard layout for administrators and regular users.
5. Enable Dashboard Home, Profile, and Logout for regular users, while visually disabling administrator-only navigation links.
6. Highlight the active navigation link.
7. Preserve existing authentication and server-side role-based authorization.
8. Refactor dashboard-related templates into reusable EJS partials where appropriate.

### Acceptance Criteria

- The user management page uses the shared dashboard layout.
- User pagination continues to display the correct page of results and supports Previous and Next navigation.
- Existing sorting, editing, and deletion functionality remains operational.
- The dashboard header displays the authenticated user's name and role.
- Regular users see disabled administrator-only links and cannot access protected admin routes.
- Administrators can access user management features according to their permissions.
- Shared layout elements are not duplicated across templates.

### Scope

**Primary outcome:** Integrate paginated user management into a reusable dashboard layout without regressing existing functionality.

**Secondary outcome:** Establish shared dashboard components for other dashboard-linked pages.

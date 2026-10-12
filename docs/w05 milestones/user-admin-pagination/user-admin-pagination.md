# W05 Feature Set 2: User Admin/Pagination- PR #43

Link: https://github.com/derasmuso/cse341-team01-project/pull/43

# Goal

Add pagination to the admin user list so clients can request users in smaller result sets. The /users page should display 10 users per page and allow administrators to move between pages.

# API

Endpoint: GET /api/users

## The endpoint must support:

page — page number; default: 1
limit — users per page; default: 10
sort — field used for sorting; default: username
order — asc or desc; default: asc
The default request should therefore return the first 10 users sorted by username in ascending order.

## Response

The response must contain the users and pagination metadata:

{
"data": [],
"pagination": {
"page": 1,
"limit": 10,
"totalItems": 25,
"totalPages": 3,
"hasNextPage": true,
"hasPreviousPage": false
}
}

# User Page

## The /users page must:

Display 10 users at a time.
Provide Previous and Next pagination controls.
Request the appropriate page from GET /api/users.
Update the displayed users when the page changes.
Keep the default username sorting behavior.
Testing plan
Document the pagination and sorting query parameters in Swagger.
Validate pagination and sorting parameters and return 400 for invalid values.
Return 200 with an empty data array when a valid page contains no users.
Preserve the existing authentication and authorization rules.
Resolves #45

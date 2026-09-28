# Week 03 Walkthrough Script

Replace the bracketed details before recording. Record locally, show your assigned feature end to end, and use your team's admin account for the protected bookings screen. Do not show credentials or the MongoDB connection string.

## Opening

"Hi, this is my Week 03 walkthrough for Feature Set [number and name]. I will demonstrate the feature in the running Kizuna Rail app, show the important model/controller/route code, and explain one implementation decision."

## Demonstrate the App

"The app is running locally at `http://127.0.0.1:3000`. The trips page loads trip data from `/api/trips`; the page builds each trip card in the browser rather than having EJS loop over the trips. I can filter the results by region or season."

Open `/trips/alpine-panorama`.

"The trip details page still renders the trip itself on the server, but schedules are loaded from `/api/trips/alpine-panorama/schedules`. Changing the month sends a new request with the month query parameter and updates only the schedule list. The Station info control fetches station details from `/api/stations/nagoya` and expands them beside the station."

Open `/trips/booking/2` and select Saturday.

"The booking page requests available ticket classes from `/api/ticket-classes?day=saturday`. Premium is disabled for Saturday, First is enabled, and the form updates its selection and price summary. The server checks the selected schedule, day, trip, passenger data, and ticket availability again before saving, so the browser is not trusted to decide the final price."

Use the page's autofill control and submit the form.

"The booking is saved with its passenger data in the `bookings` collection and redirects to the booking reference page. The confirmation page loads the saved booking by that reference."

If you have an admin account, sign in and open `/bookings-admin`.

"The bookings admin page hydrates its table from `/api/bookings`. Both the page and API require the admin role because booking records contain passenger information."

If your assigned feature set is not Bookings, spend most of the demo on your assigned feature and briefly mention the other pages only as context. Do not attempt to access the admin screen without an authorized account.

## Walk Through the Code

Open the relevant files in the editor while speaking:

"Each resource has a Mongoose schema in `src/models/schemas`. The models in `src/models` contain the database queries, keeping persistence separate from HTTP handling. Collection names are explicit where the existing database uses names such as `ticketClasses` or `bookings`."

"The API controllers in `src/controllers` call those model functions and return JSON with appropriate status codes. `src/routes/api-routes.js` maps the endpoints and documents them for Swagger. The booking page and booking submission handler are in `src/controllers/bookings.js`; the submission handler validates the chosen schedule and ticket class and calculates the price on the server."

"On the frontend, `public/js/main.js` checks `response.ok`, clones the schedule template, and writes returned values with `textContent`. That keeps markup separate from API data and avoids inserting response text as HTML. The ticket page calls the ticket-class API when the selected day changes."

## Explain a Decision

"One important decision was to protect booking records behind the admin role. The endpoint returns passenger names and contact details, so making it public just because it is a read-only API would expose personal information. I also mapped Mongoose models to the existing collection names rather than relying on Mongoose's inferred names, so the models query the collections populated by the project importer."

"The schedules seed data describes recurring days but does not contain per-schedule months. For month filtering, schedules use their own `months` field when present; otherwise the trip's `operatingMonths` determines whether schedules are returned."

## Verification and Close

"I ran the full Vitest suite: 8 tests passed. I also ran ESLint successfully and checked the trip list, schedule filter, station details, day-based ticket selection, and booking confirmation locally."

"My issue is [issue URL]. My pull request is [PR URL]. The PR includes the tested behavior and this walkthrough: [video URL]. Thanks for reviewing."

Before recording, verify the issue, PR, and video URLs above are real and that the PR description links them correctly.

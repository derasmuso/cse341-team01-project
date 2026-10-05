# Week 04 Walkthrough Script

Target length: about 4-6 minutes. Start the application and database before recording. Keep credentials and the MongoDB connection string off screen. Use the form's Auto Fill control so no real passenger information is shown.

## Opening

**Show:** The local Kizuna Rail application in the browser.

**Say:**

"Hi, this is my Week 04 walkthrough for the Trip Booking feature set: Trips, Schedules, Bookings, Ticket Classes, and Stations. I will demonstrate the booking workflow locally, explain the key code that supports it, and describe one important implementation decision."

## Demonstrate the Feature

**Show:** Open `http://127.0.0.1:3000/trips`.

**Say:**

"The trips page loads the available trips from the API. I can filter the list by region and best season. I will open Alpine Panorama to review its route and available schedules."

**Action:** Open the Alpine Panorama trip. Click a month badge and show the schedule list update. Then click **Book Now** for schedule 2, which operates on Saturday.

**Say:**

"The detail page shows the route information and requests schedules for this trip. The month controls filter the schedule request. Each schedule has a Book Now link that opens the booking form for that schedule."

**Action:** On the booking form, select Saturday.

**Say:**

"The form requests ticket classes for the selected day. For Saturday, the app disables classes that are unavailable and leaves First available. This prevents the user from selecting an option that the availability API did not return."

**Action:** Add a second passenger, use **Click Here to Auto Fill Form**, and show that the passenger count and total update. Submit the booking.

**Say:**

"I can add passengers up to the eight-passenger limit, and the summary updates when the passenger count or ticket selection changes. I am using fictional autofill data for this demo. After submission, the application saves the booking and redirects to a confirmation page with the booking reference."

**Action:** Show the confirmation page and the generated reference. Optionally open `http://127.0.0.1:3000/api/stations/nagoya` in another tab to show a station record from the Stations part of the feature set.

**Say:**

"The confirmation page displays the saved booking details. The station endpoint returns the station record used by the feature set."

## Explain the Code

**Show:** `src/views/trips/details.ejs`, around `loadSchedules`.

**Say:**

"This function builds the schedules API URL from the current trip ID. When a month is selected, it adds the month query parameter, fetches the matching schedules, and creates a Book Now link for each result. That keeps the schedule list tied to the selected trip and month."

**Show:** `src/controllers/schedules.js`.

**Say:**

"The schedule controller reads the trip ID and optional month from the request. It rejects a month unless it is an integer from 1 through 12, then asks the model for schedules and returns JSON. The model is responsible for the database query."

**Show:** `src/controllers/bookings.js`, first `bookingPage`, then `processBookingRequest`.

**Say:**

"The booking page controller loads the selected schedule, its trip, and ticket classes. It calculates each displayed ticket price from the trip distance and the class price per kilometer, then passes the options to the EJS page. The form handler checks that the required booking fields are present and that there are between one and eight passengers. It creates a confirmation reference, saves the booking through the model, and redirects to that reference. Invalid or incomplete submissions receive a client error instead of being saved."

**Show:** `public/js/booking.js`, around `updateTicketAvailability`, `addPassenger`, and `updateSummary`.

**Say:**

"The browser requests the ticket classes available for the selected day and disables unavailable choices. The passenger functions add and remove passenger cards while enforcing the eight-person limit. The summary function updates the passenger count and total shown in the form."

**Show:** `src/models/schemas/bookings.js`.

**Say:**

"The booking schema requires the schedule, trip, ticket class, selected day, and at least one passenger. Each passenger has required name, email, and phone fields, and the email is normalized to lowercase. Keeping these requirements in the schema protects the data even if a request bypasses browser-side form checks."

## Major Decision

**Say:**

"One major decision was to keep the trip booking work together as one end-to-end feature instead of splitting it into separate issues for the data model, API, and interface. Those pieces share the same trip, schedule, and ticket-class data contracts. Keeping the workflow together made it possible to test the real user path from choosing a trip through saving and confirming a booking, and gave teammates one coherent unit to review."

## Close

**Say:**

"I verified the implementation with the project test suite and ESLint. My GitHub issue is issue 27, and my pull request is pull request 28. I will add this walkthrough link to the Week 04 reflection and the pull request after the video is uploaded. Thank you."

## Before Recording

- Confirm the app and database are running locally and the booking flow works from start to confirmation.
- Use only fictional autofill passenger details; do not show credentials, `.env`, or database secrets.
- Keep the app, browser, and editor text large enough to read in the recording.
- After uploading, add the video URL to the Week 04 reflection and PR #28.

import { generateConfirmationCode } from '../includes/helpers.js';

import { getScheduleById } from '../models/schedules.js';
import { getTripById } from '../models/trips.js';
import { getAllTicketClasses } from '../models/ticket-classes.js';
import {
  countBookings,
  createBooking,
  getBookingsByPassengerEmail,
  getBookingsPage,
} from '../models/bookings.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const DEFAULT_SORT_BY = 'createdAt';
const DEFAULT_SORT_ORDER = 'desc';
const SORT_FIELDS = ['createdAt', 'ticketClass', 'selectedDay'];
const SORT_ORDERS = ['asc', 'desc'];
const TICKET_CLASSES = ['standard', 'premium', 'first'];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Reads a query value as a whole number within a range.
 * Query values are strings, or arrays when a parameter is repeated, so the
 * value is checked with a strict digits-only pattern instead of Number().
 * @returns {{ value?: number, error?: string }}
 */
const parseIntegerParam = (raw, name, defaultValue, min, max) => {
  if (raw === undefined) {
    return { value: defaultValue };
  }

  if (typeof raw !== 'string' || !/^\d+$/.test(raw)) {
    return { error: `${name} must be a whole number` };
  }

  const value = Number(raw);

  if (value < min || value > max) {
    return { error: `${name} must be between ${min} and ${max}` };
  }

  return { value };
};

/**
 * Reads a query value that must be one of a fixed list of choices.
 * @returns {{ value?: string, error?: string }}
 */
const parseChoiceParam = (raw, name, choices, defaultValue) => {
  if (raw === undefined) {
    return { value: defaultValue };
  }

  if (typeof raw !== 'string' || !choices.includes(raw)) {
    return { error: `${name} must be one of: ${choices.join(', ')}` };
  }

  return { value: raw };
};

/**
 * Reads a query value as a calendar date written as YYYY-MM-DD.
 * The value is converted to a Date and back so impossible dates such as
 * 2026-02-30 are rejected instead of silently rolling over to March.
 * @returns {{ value?: string, error?: string }}
 */
const parseDateParam = (raw, name) => {
  if (raw === undefined) {
    return { value: undefined };
  }

  if (typeof raw !== 'string' || !DATE_PATTERN.test(raw)) {
    return { error: `${name} must be a date in YYYY-MM-DD format` };
  }

  const date = new Date(`${raw}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== raw) {
    return { error: `${name} must be a real calendar date` };
  }

  return { value: raw };
};

/**
 * Validates the paging, sorting and filtering query parameters for the bookings API.
 * @param {object} query - The request's query string object.
 * @returns {{ params?: object, error?: string }} The parsed values (filters
 *   that were not supplied are undefined), or the first validation error found.
 */
const parseBookingsQuery = (query) => {
  const page = parseIntegerParam(
    query.page,
    'page',
    DEFAULT_PAGE,
    1,
    Number.MAX_SAFE_INTEGER
  );
  const limit = parseIntegerParam(
    query.limit,
    'limit',
    DEFAULT_LIMIT,
    1,
    MAX_LIMIT
  );
  const sortBy = parseChoiceParam(
    query.sortBy,
    'sortBy',
    SORT_FIELDS,
    DEFAULT_SORT_BY
  );
  const sortOrder = parseChoiceParam(
    query.sortOrder,
    'sortOrder',
    SORT_ORDERS,
    DEFAULT_SORT_ORDER
  );

  const ticketClass = parseChoiceParam(
    query.ticketClass,
    'ticketClass',
    TICKET_CLASSES,
    undefined
  );
  const startDate = parseDateParam(query.startDate, 'startDate');
  const endDate = parseDateParam(query.endDate, 'endDate');

  const failed = [
    page,
    limit,
    sortBy,
    sortOrder,
    ticketClass,
    startDate,
    endDate,
  ].find((result) => result.error);

  if (failed) {
    return { error: failed.error };
  }

  // YYYY-MM-DD strings sort the same way the dates do, so they compare directly.
  if (startDate.value && endDate.value && startDate.value > endDate.value) {
    return { error: 'startDate must be on or before endDate' };
  }

  return {
    params: {
      page: page.value,
      limit: limit.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value,
      ticketClass: ticketClass.value,
      startDate: startDate.value,
      endDate: endDate.value,
    },
  };
};

/**
 * Builds the MongoDB filter for the supplied filters, plus a plain copy of
 * the filters that were applied for the response metadata.
 * Dates are treated as UTC days, and endDate includes that whole day.
 * @returns {{ filter: object, applied: object }}
 */
const buildBookingsFilter = ({ ticketClass, startDate, endDate }) => {
  const filter = {};
  const applied = {};

  if (ticketClass) {
    filter.ticketClass = ticketClass;
    applied.ticketClass = ticketClass;
  }

  if (startDate) {
    filter.createdAt = {
      ...filter.createdAt,
      $gte: new Date(`${startDate}T00:00:00.000Z`),
    };
    applied.startDate = startDate;
  }

  if (endDate) {
    filter.createdAt = {
      ...filter.createdAt,
      $lte: new Date(`${endDate}T23:59:59.999Z`),
    };
    applied.endDate = endDate;
  }

  return { filter, applied };
};

const bookingPage = async (req, res) => {
  const { scheduleId } = req.params;

  const schedule = await getScheduleById(scheduleId);
  console.log('scheduleId:', scheduleId);
  console.log('schedule:', schedule);

  const trip = await getTripById(schedule.tripId);
  console.log('trip:', trip);
  console.log('tripId:', schedule.tripId);

  const ticketClasses = await getAllTicketClasses();

  const ticketOptions = ticketClasses.map((ticketClass) => ({
    class: ticketClass.class,
    name: ticketClass.class,
    price: trip.distance * ticketClass.pricePerKm,
    amenities: ticketClass.amenities,
    description: ticketClass.description,
  }));

  res.render('trips/book', {
    title: 'Book Trip',
    schedule,
    ticketOptions,
  });
};

const processBookingRequest = async (req, res) => {
  const booking = {
    id: generateConfirmationCode(),
    createdAt: new Date().toISOString(),
    ...req.body,
  };

  await createBooking(booking);

  res.redirect(`/trips/confirmation/${booking.id}`);
};

/**
 * API controller: returns one page of bookings as JSON, along with metadata
 * describing the query (total items, current page, page size, sort and filters).
 * The ticket class and booking date filters apply before paging, so the totals
 * and page count describe only the matching bookings.
 */
const getAllBookings = async (req, res) => {
  const { params, error: validationError } = parseBookingsQuery(req.query);

  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const { page, limit, sortBy, sortOrder } = params;
  const { filter, applied } = buildBookingsFilter(params);

  try {
    const [bookings, totalItems] = await Promise.all([
      getBookingsPage({
        filter,
        sortBy,
        sortDirection: sortOrder === 'asc' ? 1 : -1,
        skip: (page - 1) * limit,
        limit,
      }),
      countBookings(filter),
    ]);

    return res.status(200).json({
      bookings,
      meta: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        page,
        limit,
        sortBy,
        sortOrder,
        filters: applied,
      },
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

/**
 * API controller: returns the bookings where the signed-in user's email matches
 * one of the passengers. The email always comes from the session, never from
 * the request, so a user can only ever see their own bookings.
 */
export async function getMyBookings(req, res) {
  // Sessions created before the email was stored need to log in again.
  if (!req.user.email) {
    return res
      .status(401)
      .json({ error: 'Session is out of date. Please log in again.' });
  }

  try {
    const bookings = await getBookingsByPassengerEmail(req.user.email);
    return res.status(200).json({ bookings });
  } catch (error) {
    console.error('Error fetching bookings for user:', error);
    return res.status(500).json({ error: 'Failed to fetch bookings' });
  }
}

/**
 * Renders the bookings admin page, which populates its list of bookings
 * client-side by calling the bookings API.
 */
const bookingsAdminPage = (req, res) => {
  res.render('bookings', {
    title: 'Bookings Admin',
    ticketClasses: TICKET_CLASSES,
  });
};

export {
  bookingPage,
  processBookingRequest,
  getAllBookings,
  bookingsAdminPage,
};

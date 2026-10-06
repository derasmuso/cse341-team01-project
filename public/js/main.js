const hookTrainsCatalog = async () => {
    const listEl = document.getElementById('trains-list');
    const templateEl = document.getElementById('train-card-template');
    const loadingEl = document.getElementById('trains-loading');
    const errorEl = document.getElementById('trains-error');

    if (!listEl || !templateEl) {
        return;
    }

    try {
        const response = await fetch('/api/trains');
        if (!response.ok) {
            throw new Error(`Failed to load trains (${response.status})`);
        }

        const payload = await response.json();
        const trains = payload.trains || [];
        const fragment = document.createDocumentFragment();

        trains.forEach((train) => {
            const card = templateEl.content.cloneNode(true);
            const imageEl = card.querySelector('[data-field="image"]');

            imageEl.src = train.imageUrl;
            imageEl.alt = train.imageAlt || `${train.name} train`;

            card.querySelector('[data-field="name"]').textContent = train.name;
            card.querySelector('[data-field="operator"]').textContent = train.operator;
            card.querySelector('[data-field="type"]').textContent = train.type;
            card.querySelector('[data-field="speed"]').textContent = `${train.maxSpeedKmh} km/h`;
            card.querySelector('[data-field="seats"]').textContent = `${train.capacity} seats`;
            card.querySelector('[data-field="power"]').textContent = train.powerSource;
            card.querySelector('[data-field="description"]').textContent = train.description;
            card.querySelector('[data-field="best-for"]').textContent = train.bestFor;

            fragment.appendChild(card);
        });

        listEl.replaceChildren(fragment);
        if (loadingEl) {
            loadingEl.hidden = true;
        }
    } catch (error) {
        if (loadingEl) {
            loadingEl.hidden = true;
        }
        if (errorEl) {
            errorEl.hidden = false;
            errorEl.textContent = 'Unable to load trains right now. Please try again in a moment.';
        }
    }
};

const hookBookingsAdmin = async () => {
    const tableEl = document.getElementById('bookings-table');
    const listEl = document.getElementById('bookings-list');
    const templateEl = document.getElementById('booking-row-template');
    const loadingEl = document.getElementById('bookings-loading');
    const errorEl = document.getElementById('bookings-error');
    const emptyEl = document.getElementById('bookings-empty');

    if (!tableEl || !listEl || !templateEl) {
        return;
    }

    try {
        const response = await fetch('/api/bookings');
        if (!response.ok) {
            throw new Error(`Failed to load bookings (${response.status})`);
        }

        const payload = await response.json();
        const bookings = payload.bookings || [];

        if (loadingEl) {
            loadingEl.hidden = true;
        }

        if (bookings.length === 0) {
            if (emptyEl) {
                emptyEl.hidden = false;
            }
            return;
        }

        const fragment = document.createDocumentFragment();

        bookings.forEach((booking) => {
            const row = templateEl.content.cloneNode(true);
            const passengerCount = Array.isArray(booking.passengers) ? booking.passengers.length : 0;
            const bookedOn = booking.createdAt ? new Date(booking.createdAt).toLocaleString() : '';

            row.querySelector('[data-field="id"]').textContent = booking.id;
            row.querySelector('[data-field="ticketClass"]').textContent = booking.ticketClass;
            row.querySelector('[data-field="selectedDay"]').textContent = booking.selectedDay;
            row.querySelector('[data-field="passengers"]').textContent = passengerCount;
            row.querySelector('[data-field="createdAt"]').textContent = bookedOn;

            fragment.appendChild(row);
        });

        listEl.replaceChildren(fragment);
        tableEl.hidden = false;
    } catch (error) {
        if (loadingEl) {
            loadingEl.hidden = true;
        }
        if (errorEl) {
            errorEl.hidden = false;
            errorEl.textContent = 'Unable to load bookings right now. Please try again in a moment.';
        }
    }
};

const hookTripsList = async () => {
    const listEl = document.getElementById('trips-list');
    const templateEl = document.getElementById('trip-card-template');
    const loadingEl = document.getElementById('trips-loading');
    const errorEl = document.getElementById('trips-error');
    const emptyEl = document.getElementById('trips-empty');
    const regionSelect = document.getElementById('region-filter');
    const seasonSelect = document.getElementById('season-filter');
    const searchForm = document.getElementById('trip-search-form');
    const searchInput = document.getElementById('search-filter');
    const paginationEl = document.getElementById('trips-pagination');
    const prevBtn = document.getElementById('trips-prev');
    const nextBtn = document.getElementById('trips-next');
    const indicatorEl = document.getElementById('trips-page-indicator');
    const pageSize = 2; // Number of trips to display per page

    if (!listEl || !templateEl) {
        return;
    }

    let currentPage = 1;

    // Page and filters from the URL; a bad ?page falls back to 1
    const readStateFromUrl = () => {
        const params = new URLSearchParams(window.location.search);
        const page = Number.parseInt(params.get('page'), 10);

        return {
            page: page >= 1 ? page : 1,
            region: params.get('region') || 'all',
            season: params.get('season') || 'all',
            search: params.get('search') || '',
        };
    };

    // Filters as currently chosen on the page, starting back at page 1
    const readStateFromControls = () => ({
        page: 1,
        region: regionSelect.value,
        season: seasonSelect.value,
        search: searchInput.value.trim(),
    });

    // Shared by the API request and the page URL; "all" and an empty search are left out
    const buildParams = ({ page, region, season, search }) => {
        const params = new URLSearchParams();

        if (region !== 'all') {
            params.set('region', region);
        }
        if (season !== 'all') {
            params.set('season', season);
        }
        if (search) {
            params.set('search', search);
        }
        params.set('page', page);

        return params;
    };

    // Makes the dropdowns and search box match the URL
    const syncControls = ({ region, season, search }) => {
        regionSelect.value = region;
        seasonSelect.value = season;
        searchInput.value = search;
    };

    const buildCard = (trip) => {
        const card = templateEl.content.cloneNode(true);
        card.querySelector('.route-card').classList.add(trip.region);
        card.querySelector('[data-field="name"]').textContent = trip.name;
        card.querySelector('[data-field="region"]').textContent = trip.region;
        card.querySelector('[data-field="start"]').textContent = trip.startStation;
        card.querySelector('[data-field="end"]').textContent = trip.endStation;
        card.querySelector('[data-field="duration"]').textContent = trip.duration;
        card.querySelector('[data-field="distance"]').textContent = `${trip.distance}km`;
        card.querySelector('[data-field="description"]').textContent = trip.description;
        card.querySelector('[data-field="link"]').href = `/trips/${trip.id}`;

        const seasonEl = card.querySelector('[data-field="season"]');
        seasonEl.classList.add(`season-${trip.bestSeason}`);
        seasonEl.textContent = `Best in ${trip.bestSeason}`;

        const highlightsEl = card.querySelector('[data-field="highlights"]');
        trip.highlights.forEach((highlight) => {
            const tag = document.createElement('span');
            tag.className = 'highlight-tag';
            tag.textContent = highlight;
            highlightsEl.appendChild(tag);
        });
        return card;
    };

    // Fetches one page of filtered trips and updates the cards, empty message, and paging controls
    const loadTrips = async (state) => {
        loadingEl.hidden = false;
        errorEl.hidden = true;
        emptyEl.hidden = true;

        try {
            const params = buildParams(state);
            params.set('limit', pageSize);

            const response = await fetch(`/api/trips?${params}`);
            if (!response.ok) {
                throw new Error(`Failed to load trips (${response.status})`);
            }

            const payload = await response.json();
            const trips = payload.trips || [];
            currentPage = payload.page;

            const fragment = document.createDocumentFragment();
            trips.forEach((trip) => fragment.appendChild(buildCard(trip)));
            listEl.replaceChildren(fragment);

            if (payload.totalTrips === 0) {
                emptyEl.hidden = false;
                paginationEl.hidden = true;
                return;
            }

            indicatorEl.textContent = `Page ${currentPage} of ${payload.totalPages}`;
            prevBtn.disabled = currentPage <= 1;
            nextBtn.disabled = currentPage >= payload.totalPages;
            paginationEl.hidden = false;
        } catch (error) {
            listEl.replaceChildren();
            paginationEl.hidden = true;
            errorEl.hidden = false;
            errorEl.textContent = 'Unable to load trips right now. Please try again in a moment.';
        } finally {
            loadingEl.hidden = true;
        }
    };

    // Saves the state to the URL without a reload, then loads it
    const navigate = (state) => {
        window.history.pushState({}, '', `${window.location.pathname}?${buildParams(state)}`);
        loadTrips(state);
    };

    // Paging keeps the filters that are in the URL
    const goToPage = (page) => {
        navigate({ ...readStateFromUrl(), page });
        listEl.scrollIntoView({ behavior: 'smooth' });
    };

    // Changing a filter or searching goes back to page 1
    regionSelect.addEventListener('change', () => navigate(readStateFromControls()));
    seasonSelect.addEventListener('change', () => navigate(readStateFromControls()));

    searchForm.addEventListener('submit', (event) => {
        event.preventDefault();
        navigate(readStateFromControls());
    });

    prevBtn.addEventListener('click', () => goToPage(currentPage - 1));
    nextBtn.addEventListener('click', () => goToPage(currentPage + 1));

    // Browser Back/Forward: restore the controls and the results
    window.addEventListener('popstate', () => {
        const state = readStateFromUrl();
        syncControls(state);
        loadTrips(state);
    });

    const initialState = readStateFromUrl();
    syncControls(initialState);
    loadTrips(initialState);
};

const hookUserDashboard = async () => {
    const tableEl = document.getElementById('my-bookings-table');
    const listEl = document.getElementById('my-bookings-list');
    const templateEl = document.getElementById('my-booking-row-template');
    const loadingEl = document.getElementById('my-bookings-loading');
    const errorEl = document.getElementById('my-bookings-error');
    const emptyEl = document.getElementById('my-bookings-empty');

    if (!tableEl || !listEl || !templateEl) {
        return;
    }

    try {
        const response = await fetch('/api/bookings/mine');
        if (!response.ok) {
            throw new Error(`Failed to load bookings (${response.status})`);
        }

        const payload = await response.json();
        const bookings = payload.bookings || [];

        loadingEl.hidden = true;

        if (bookings.length === 0) {
            emptyEl.hidden = false;
            return;
        }

        const fragment = document.createDocumentFragment();

        bookings.forEach((booking) => {
            const row = templateEl.content.cloneNode(true);
            const passengerCount = Array.isArray(booking.passengers) ? booking.passengers.length : 0;
            const bookedOn = booking.createdAt ? new Date(booking.createdAt).toLocaleString() : '';

            row.querySelector('[data-field="id"]').textContent = booking.id;
            row.querySelector('[data-field="ticketClass"]').textContent = booking.ticketClass;
            row.querySelector('[data-field="selectedDay"]').textContent = booking.selectedDay;
            row.querySelector('[data-field="passengers"]').textContent = passengerCount;
            row.querySelector('[data-field="createdAt"]').textContent = bookedOn;

            fragment.appendChild(row);
        });

        listEl.replaceChildren(fragment);
        tableEl.hidden = false;
    } catch (error) {
        loadingEl.hidden = true;
        errorEl.hidden = false;
        errorEl.textContent = 'Unable to load your bookings right now. Please try again in a moment.';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    hookTrainsCatalog();
    hookBookingsAdmin();
    hookTripsList();
    hookUserDashboard();
});
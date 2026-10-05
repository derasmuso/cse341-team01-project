const hookRegionSorter = () => {
    const regionSelect = document.getElementById('region-filter');
    if (regionSelect) {
        regionSelect.addEventListener('change', () => {
            const selectedRegion = regionSelect.value;
            const url = new URL(window.location.href);

            if (selectedRegion && selectedRegion !== 'all') {
                url.searchParams.set('region', selectedRegion);
            } else {
                url.searchParams.delete('region');
            }

            window.location.href = url.toString();
        });
    }
};

const hookSeasonSorter = () => {
    const seasonSelect = document.getElementById('season-filter');
    if (seasonSelect) {
        seasonSelect.addEventListener('change', () => {
            const selectedSeason = seasonSelect.value;
            const url = new URL(window.location.href);

            if (selectedSeason && selectedSeason !== 'all') {
                url.searchParams.set('season', selectedSeason);
            } else {
                url.searchParams.delete('season');
            }

            window.location.href = url.toString();
        });
    }
};

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
    const regionSelect = document.getElementById('region-filter');
    const seasonSelect = document.getElementById('season-filter');
    const paginationEl = document.getElementById('trips-pagination');
    const prevBtn = document.getElementById('trips-prev');
    const nextBtn = document.getElementById('trips-next');
    const indicatorEl = document.getElementById('trips-page-indicator');
    const pageSize = 2;

    if (!listEl || !templateEl) {
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const region = params.get('region') || 'all';
    const season = params.get('season') || 'all';
    regionSelect.value = region;
    seasonSelect.value = season;

    let currentPage = 1;

    // Anything bad in the URL (?page=abc, ?page=0) falls back to page 1
    const readPageFromUrl = () => {
        const page = Number.parseInt(new URLSearchParams(window.location.search).get('page'), 10);     // Reads ?page=N so a refresh stays on the same page. Anything invalid, like ?page=abc, falls back to page 1.
        return page >= 1 ? page : 1;
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

    const loadPage = async (page) => {             // Fetches /api/trips?page=N&limit=10, builds a card for each trip, updates "Page X of Y," and disables Previous on page 1 and Next on the last page.
        loadingEl.hidden = false;
        errorEl.hidden = true;

        try {
            const response = await fetch(`/api/trips?page=${page}&limit=${pageSize}`);
            if (!response.ok) {
                throw new Error(`Failed to load trips (${response.status})`);
            }

            const payload = await response.json();
            const trips = payload.trips || [];
            currentPage = payload.page;

            // Temporary: filters only the current page until Issue 2 moves filtering to the server
            const visibleTrips = trips.filter((trip) =>
                (region === 'all' || trip.region === region) &&
                (season === 'all' || trip.bestSeason === season)
            );

            const fragment = document.createDocumentFragment();
            visibleTrips.forEach((trip) => fragment.appendChild(buildCard(trip)));
            listEl.replaceChildren(fragment);

            indicatorEl.textContent = `Page ${currentPage} of ${Math.max(payload.totalPages, 1)}`;
            prevBtn.disabled = currentPage <= 1;
            nextBtn.disabled = currentPage >= payload.totalPages;
            paginationEl.hidden = false;
        } catch (error) {
            errorEl.hidden = false;
            errorEl.textContent = 'Unable to load trips right now. Please try again in a moment.';
        } finally {
            loadingEl.hidden = true;
        }
    };

    const goToPage = (page) => {                                    // 	Runs when Next or Previous is clicked. It updates the URL with pushState, so there's no reload, then loads that page.
        const url = new URL(window.location.href);
        url.searchParams.set('page', page);
        window.history.pushState({}, '', url);
        loadPage(page);
        listEl.scrollIntoView({ behavior: 'smooth' });
    };

    prevBtn.addEventListener('click', () => goToPage(currentPage - 1));
    nextBtn.addEventListener('click', () => goToPage(currentPage + 1));

    // Browser Back/Forward buttons
    window.addEventListener('popstate', () => loadPage(readPageFromUrl()));          // Makes the browser's Back and Forward buttons move between pages.

    loadPage(readPageFromUrl());
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
    hookRegionSorter();
    hookSeasonSorter();
    hookTrainsCatalog();
    hookBookingsAdmin();
    hookTripsList();
    hookUserDashboard();
});
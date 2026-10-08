
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
    const prevButton = document.getElementById('trains-prev');
    const nextButton = document.getElementById('trains-next');
    const pageEl = document.getElementById('trains-page');

    if (!listEl || !templateEl) {
        return;
    }

    let currentPage = 1;

    const loadPage = async (page) => {
        if (loadingEl) {
            loadingEl.hidden = false;
        }

        if (errorEl) {
            errorEl.hidden = true;
        }

        try {
            const response = await fetch(`/api/trains?page=${page}`);

            if (!response.ok) {
                throw new Error(`Failed to load trains (${response.status})`);
            }

            const payload = await response.json();
            const trains = payload.data || [];
            const metadata = payload.metadata;

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

            currentPage = metadata.page;

            if (pageEl) {
                pageEl.textContent = `Page ${metadata.page} of ${metadata.totalPages}`;
            }

            if (prevButton) {
                prevButton.disabled = metadata.page <= 1;
            }

            if (nextButton) {
                nextButton.disabled = metadata.page >= metadata.totalPages;
            }

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

    if (prevButton) {
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                loadPage(currentPage - 1);
            }
        });
    }

    if (nextButton) {
        nextButton.addEventListener('click', () => {
            loadPage(currentPage + 1);
        });
    }

    await loadPage(1);
};

const BOOKINGS_PAGE_SIZE = 10;

const hookBookingsAdmin = async () => {
    const tableEl = document.getElementById('bookings-table');
    const listEl = document.getElementById('bookings-list');
    const templateEl = document.getElementById('booking-row-template');
    const loadingEl = document.getElementById('bookings-loading');
    const errorEl = document.getElementById('bookings-error');
    const emptyEl = document.getElementById('bookings-empty');
    const paginationEl = document.getElementById('bookings-pagination');
    const prevButton = document.getElementById('bookings-prev');
    const nextButton = document.getElementById('bookings-next');
    const pageInfoEl = document.getElementById('bookings-page-info');
    const rangeEl = document.getElementById('bookings-range');
    const filterForm = document.getElementById('bookings-filters');
    const clearButton = document.getElementById('filters-clear');

    if (!tableEl || !listEl || !templateEl) {
        return;
    }

    // The filters currently applied. They are kept while stepping through pages.
    let filters = {};

    const renderRows = (bookings) => {
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
    };

    // Everything the controls show comes from the meta object the API returns.
    const renderPagination = (meta, shownCount) => {
        if (!paginationEl) {
            return;
        }

        const firstItem = (meta.page - 1) * meta.limit + 1;

        pageInfoEl.textContent = `Page ${meta.page} of ${meta.totalPages}`;
        rangeEl.textContent = `Showing ${firstItem}-${firstItem + shownCount - 1} of ${meta.totalItems}`;
        prevButton.disabled = meta.page <= 1;
        nextButton.disabled = meta.page >= meta.totalPages;
        prevButton.onclick = () => loadPage(meta.page - 1);
        nextButton.onclick = () => loadPage(meta.page + 1);
        paginationEl.hidden = false;
    };

    const loadPage = async (page) => {
        loadingEl.hidden = false;
        errorEl.hidden = true;

        try {
            const params = new URLSearchParams({ page, limit: BOOKINGS_PAGE_SIZE, ...filters });
            const response = await fetch(`/api/bookings?${params}`);
            if (!response.ok) {
                const failure = new Error(`Failed to load bookings (${response.status})`);
                // A 400 message explains what is wrong with the filters, so show it.
                if (response.status === 400) {
                    failure.userMessage = (await response.json()).error;
                }
                throw failure;
            }

            const payload = await response.json();
            const bookings = payload.bookings || [];
            const { meta } = payload;

            loadingEl.hidden = true;

            if (meta.totalItems === 0) {
                tableEl.hidden = true;
                if (paginationEl) {
                    paginationEl.hidden = true;
                }
                emptyEl.textContent = Object.keys(meta.filters || {}).length > 0
                    ? 'No bookings match your filters.'
                    : 'No bookings have been made yet.';
                emptyEl.hidden = false;
                return;
            }

            emptyEl.hidden = true;

            // The requested page is past the end (for example, bookings were
            // removed since the last load), so jump to the last real page.
            if (bookings.length === 0 && meta.page > meta.totalPages) {
                await loadPage(meta.totalPages);
                return;
            }

            renderRows(bookings);
            renderPagination(meta, bookings.length);
            tableEl.hidden = false;
        } catch (error) {
            loadingEl.hidden = true;
            errorEl.hidden = false;
            errorEl.textContent = error.userMessage
                || 'Unable to load bookings right now. Please try again in a moment.';
        }
    };

    if (filterForm) {
        filterForm.addEventListener('submit', (event) => {
            event.preventDefault();
            // Empty fields mean "no filter", so they are left out of the query.
            filters = Object.fromEntries(
                [...new FormData(filterForm)].filter(([, value]) => value !== '')
            );
            loadPage(1);
        });
    }

    if (clearButton) {
        clearButton.addEventListener('click', () => {
            filterForm.reset();
            filters = {};
            loadPage(1);
        });
    }

    await loadPage(1);
};

const hookTripsList = async () => {
    const listEl = document.getElementById('trips-list');
    const templateEl = document.getElementById('trip-card-template');
    const loadingEl = document.getElementById('trips-loading');
    const errorEl = document.getElementById('trips-error');
    const regionSelect = document.getElementById('region-filter');
    const seasonSelect = document.getElementById('season-filter');

    if (!listEl || !templateEl) {
        return;
    }

    const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

    const fillSelect = (select, values) => {
        [...new Set(values)].forEach((value) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = capitalize(value);
            select.appendChild(option);
        });
    };

    try {
        const response = await fetch('/api/trips');
        if (!response.ok) {
            throw new Error(`Failed to load trips (${response.status})`);
        }

        const trips = await response.json();

        fillSelect(regionSelect, trips.map((trip) => trip.region));
        fillSelect(seasonSelect, trips.map((trip) => trip.bestSeason));

        const params = new URLSearchParams(window.location.search);
        const region = params.get('region') || 'all';
        const season = params.get('season') || 'all';
        regionSelect.value = region;
        seasonSelect.value = season;

        const visibleTrips = trips.filter((trip) =>
            (region === 'all' || trip.region === region) &&
            (season === 'all' || trip.bestSeason === season)
        );

        const fragment = document.createDocumentFragment();

        visibleTrips.forEach((trip) => {
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

            fragment.appendChild(card);
        });

        listEl.replaceChildren(fragment);
        loadingEl.hidden = true;
    } catch (error) {
        loadingEl.hidden = true;
        errorEl.hidden = false;
        errorEl.textContent = 'Unable to load trips right now. Please try again in a moment.';
    }
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


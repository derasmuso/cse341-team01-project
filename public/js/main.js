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
    const emptyEl = document.getElementById('trains-empty');

    if (!listEl || !templateEl) {
        return;
    }

    const searchEl = document.getElementById('trains-search');
    const typeEl = document.getElementById('trains-type-filter');
    const sortEl = document.getElementById('trains-sort');
    const paginationEl = document.getElementById('trains-pagination');
    const prevBtn = document.getElementById('trains-prev');
    const nextBtn = document.getElementById('trains-next');
    const indicatorEl = document.getElementById('trains-page-indicator');

    const PAGE_SIZE = 10;
    const state = { page: 1, search: '', type: '', sort: 'name', totalPages: 1 };

    const buildUrl = () => {
        const params = new URLSearchParams();
        params.set('page', String(state.page));
        params.set('pageSize', String(PAGE_SIZE));
        if (state.search) params.set('search', state.search);
        if (state.type) params.set('type', state.type);
        if (state.sort) params.set('sort', state.sort);
        return `/api/trains?${params.toString()}`;
    };

    const populateTypeFilter = (types) => {
        if (!typeEl || typeEl.dataset.populated === 'true') return;
        const unique = [...new Set(types)].filter(Boolean).sort();
        unique.forEach((value) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            typeEl.appendChild(option);
        });
        typeEl.dataset.populated = 'true';
    };

    const renderCards = (trains) => {
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
    };

    const load = async () => {
        if (loadingEl) loadingEl.hidden = false;
        if (errorEl) errorEl.hidden = true;
        if (emptyEl) emptyEl.hidden = true;

        try {
            const response = await fetch(buildUrl());
            if (!response.ok) {
                throw new Error(`Failed to load trains (${response.status})`);
            }

            const payload = await response.json();
            const trains = payload.trains || [];
            const meta = payload.metadata || { totalPages: 1, page: 1 };

            populateTypeFilter(trains.map((t) => t.type));
            renderCards(trains);

            state.totalPages = meta.totalPages || 1;

            if (paginationEl) paginationEl.hidden = false;
            if (indicatorEl) indicatorEl.textContent = `Page ${meta.page} of ${meta.totalPages}`;
            if (prevBtn) prevBtn.disabled = meta.page <= 1;
            if (nextBtn) nextBtn.disabled = meta.page >= meta.totalPages;

            if (trains.length === 0 && emptyEl) {
                emptyEl.hidden = false;
            }
        } catch (error) {
            if (errorEl) {
                errorEl.hidden = false;
                errorEl.textContent = 'Unable to load trains right now. Please try again in a moment.';
            }
        } finally {
            if (loadingEl) loadingEl.hidden = true;
        }
    };

    // ---- Pagination buttons ----
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (state.page > 1) {
                state.page -= 1;
                load();
            }
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (state.page < state.totalPages) {
                state.page += 1;
                load();
            }
        });
    }

    // ---- Debounced search ----
    if (searchEl) {
        let debounceId;
        searchEl.addEventListener('input', () => {
            clearTimeout(debounceId);
            debounceId = setTimeout(() => {
                state.search = searchEl.value.trim();
                state.page = 1;
                load();
            }, 300);
        });
    }

    // ---- Type filter ----
    if (typeEl) {
        typeEl.addEventListener('change', () => {
            state.type = typeEl.value;
            state.page = 1;
            load();
        });
    }

    // ---- Sort ----
    if (sortEl) {
        sortEl.addEventListener('change', () => {
            state.sort = sortEl.value;
            state.page = 1;
            load();
        });
    }

    await load();
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
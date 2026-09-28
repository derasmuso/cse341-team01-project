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

const hookTripSchedules = async () => {
    const section = document.querySelector('[data-trip-schedules]');
    const listEl = document.getElementById('schedules-list');
    const templateEl = document.getElementById('schedule-card-template');
    const loadingEl = document.getElementById('schedules-loading');
    const errorEl = document.getElementById('schedules-error');
    const emptyEl = document.getElementById('schedules-empty');
    const monthSelect = document.getElementById('schedule-month');

    if (!section || !listEl || !templateEl) return;

    const loadSchedules = async () => {
        loadingEl.hidden = false;
        errorEl.hidden = true;
        emptyEl.hidden = true;
        try {
            const month = monthSelect.value;
            const query = month === 'all' ? '' : `?month=${encodeURIComponent(month)}`;
            const response = await fetch(`/api/trips/${encodeURIComponent(section.dataset.tripId)}/schedules${query}`);
            if (!response.ok) throw new Error(`Failed to load schedules (${response.status})`);
            const schedules = await response.json();
            const fragment = document.createDocumentFragment();

            schedules.forEach((schedule) => {
                const card = templateEl.content.cloneNode(true);
                card.querySelector('[data-field="departure"]').textContent = schedule.departureTime;
                card.querySelector('[data-field="arrival"]').textContent = schedule.arrivalTime;
                card.querySelector('[data-field="link"]').href = `/trips/booking/${schedule.id}`;
                const days = card.querySelector('[data-field="days"]');
                schedule.daysOfWeek.forEach((day) => {
                    const badge = document.createElement('span');
                    badge.className = 'day-badge';
                    badge.textContent = day.slice(0, 3);
                    days.appendChild(badge);
                });
                fragment.appendChild(card);
            });

            listEl.replaceChildren(fragment);
            emptyEl.hidden = schedules.length > 0;
        } catch (error) {
            errorEl.textContent = 'Unable to load schedules right now.';
            errorEl.hidden = false;
            listEl.replaceChildren();
        } finally {
            loadingEl.hidden = true;
        }
    };

    monthSelect.addEventListener('change', loadSchedules);
    await loadSchedules();
};

const hookStationDetails = () => {
    document.querySelectorAll('.station-detail-toggle').forEach((button) => {
        button.addEventListener('click', async () => {
            const detail = button.nextElementSibling;
            if (!detail.hidden) {
                detail.hidden = true;
                button.setAttribute('aria-expanded', 'false');
                return;
            }

            detail.hidden = false;
            button.setAttribute('aria-expanded', 'true');
            if (detail.dataset.loaded === 'true') return;
            detail.textContent = 'Loading station information...';

            try {
                const response = await fetch(`/api/stations/${encodeURIComponent(button.dataset.stationId)}`);
                if (!response.ok) throw new Error(`Failed to load station (${response.status})`);
                const station = await response.json();
                detail.replaceChildren();
                const location = document.createElement('p');
                location.textContent = `${station.prefecture} · ${station.region}`;
                const description = document.createElement('p');
                description.textContent = station.description;
                const facilities = document.createElement('p');
                facilities.textContent = `Facilities: ${station.facilities.join(', ')}`;
                detail.append(location, description, facilities);
                detail.dataset.loaded = 'true';
            } catch (error) {
                detail.textContent = 'Unable to load station information.';
            }
        });
    });
};

const hookBookingsCatalog = async () => {
    const listEl = document.getElementById('bookings-list');
    const templateEl = document.getElementById('booking-row-template');
    const loadingEl = document.getElementById('bookings-loading');
    const errorEl = document.getElementById('bookings-error');
    const emptyEl = document.getElementById('bookings-empty');

    if (!listEl || !templateEl) return;
    try {
        const response = await fetch('/api/bookings');
        if (!response.ok) throw new Error(`Failed to load bookings (${response.status})`);
        const bookings = await response.json();
        const fragment = document.createDocumentFragment();
        bookings.forEach((booking) => {
            const row = templateEl.content.cloneNode(true);
            row.querySelector('[data-field="reference"]').textContent = booking.id;
            row.querySelector('[data-field="trip"]').textContent = booking.tripId;
            row.querySelector('[data-field="travel-day"]').textContent = booking.selectedDay;
            row.querySelector('[data-field="ticket"]').textContent = booking.ticketClass;
            row.querySelector('[data-field="passengers"]').textContent = booking.passengers
                .map((passenger) => `${passenger.firstName} ${passenger.lastName}`)
                .join(', ');
            row.querySelector('[data-field="created"]').textContent = new Date(booking.createdAt).toLocaleDateString();
            fragment.appendChild(row);
        });
        listEl.replaceChildren(fragment);
        emptyEl.hidden = bookings.length > 0;
    } catch (error) {
        errorEl.textContent = 'Unable to load bookings. Check your admin access and try again.';
        errorEl.hidden = false;
    } finally {
        loadingEl.hidden = true;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    hookRegionSorter();
    hookSeasonSorter();
    hookTrainsCatalog();
    hookTripsList();
    hookTripSchedules();
    hookStationDetails();
    hookBookingsCatalog();
});
// public/js/admin-trips.js

const PAGE_SIZE = 10;

const state = {
    page: 1,
    totalPages: 1,
};

const els = {
    list: document.getElementById('trips-list'),
    template: document.getElementById('admin-trip-row-template'),
    loading: document.getElementById('trips-loading'),
    error: document.getElementById('trips-error'),
    empty: document.getElementById('trips-empty'),
    pagination: document.getElementById('trips-pagination'),
    prev: document.getElementById('trips-previous-page'),
    next: document.getElementById('trips-next-page'),
    pageInfo: document.getElementById('trips-page-info'),
    message: document.getElementById('trips-message'),
};

function buildUrl() {
    const params = new URLSearchParams();
    params.set('page', String(state.page));
    params.set('limit', String(PAGE_SIZE));
    return `/api/trips?${params.toString()}`;
}

function renderTrips(trips) {
    const frag = document.createDocumentFragment();
    trips.forEach((trip) => {
        const node = els.template.content.cloneNode(true);
        node.querySelector('[data-field="name"]').textContent = trip.name;
        node.querySelector('[data-field="region"]').textContent = trip.region;
        node.querySelector('[data-field="start"]').textContent = trip.startStation;
        node.querySelector('[data-field="end"]').textContent = trip.endStation;
        node.querySelector('[data-field="duration"]').textContent = trip.duration;
        node.querySelector('[data-field="distance"]').textContent = trip.distance;
        node.querySelector('[data-field="season"]').textContent = trip.bestSeason;
        node.querySelector('[data-field="description"]').textContent = trip.description;
        frag.appendChild(node);
    });
    els.list.replaceChildren(frag);
}

async function load() {
    if (els.loading) els.loading.hidden = false;
    if (els.error) els.error.hidden = true;
    if (els.empty) els.empty.hidden = true;

    try {
        const res = await fetch(buildUrl());
        if (!res.ok) throw new Error(`Failed (${res.status})`);
        const payload = await res.json();

        const trips = payload.trips || [];
        const totalPages = payload.totalPages || 1;

        state.totalPages = totalPages;

        if (trips.length === 0) {
            els.list.replaceChildren();
            if (els.empty) els.empty.hidden = false;
        } else {
            renderTrips(trips);
        }

        if (els.pagination) els.pagination.hidden = false;
        if (els.pageInfo) els.pageInfo.textContent = `Page ${payload.page || 1} of ${totalPages}`;
        if (els.prev) els.prev.disabled = (payload.page || 1) <= 1;
        if (els.next) els.next.disabled = (payload.page || 1) >= totalPages;
    } catch (err) {
        if (els.error) {
            els.error.hidden = false;
            els.error.textContent = 'Unable to load trips right now.';
        }
    } finally {
        if (els.loading) els.loading.hidden = true;
    }
}

if (els.prev) {
    els.prev.addEventListener('click', () => {
        if (state.page > 1) {
            state.page -= 1;
            load();
        }
    });
}

if (els.next) {
    els.next.addEventListener('click', () => {
        if (state.page < state.totalPages) {
            state.page += 1;
            load();
        }
    });
}

load();
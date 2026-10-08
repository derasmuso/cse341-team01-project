const hookTrainsCatalog = async () => {
    const listEl = document.getElementById('trains-list');
    const templateEl = document.getElementById('train-card-template');
    const loadingEl = document.getElementById('trains-loading');
    const errorEl = document.getElementById('trains-error');
    const prevButton = document.getElementById('trains-prev');
    const nextButton = document.getElementById('trains-next');
    const pageEl = document.getElementById('trains-page');
    const searchInput = document.getElementById('trains-search-input');
    const searchButton = document.getElementById('trains-search-button');

    if (!listEl || !templateEl) {
        return;
    }

    let currentPage = 1;
    let currentSearch = '';

    const loadPage = async (page) => {
        if (loadingEl) {
            loadingEl.hidden = false;
        }

        if (errorEl) {
            errorEl.hidden = true;
        }

        try {
            const params = new URLSearchParams({
                page,
                search: currentSearch,
            });

            const response = await fetch(`/api/trains?${params}`);

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

            if (trains.length === 0 && errorEl) {
                errorEl.hidden = false;
                errorEl.textContent = 'No trains matched your search.';
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

    const performSearch = () => {
        currentSearch = searchInput ? searchInput.value.trim() : '';
        loadPage(1);
    };

    if (searchButton) {
        searchButton.addEventListener('click', performSearch);
    }

    if (searchInput) {
        searchInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                performSearch();
            }
        });
    }

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

document.addEventListener('DOMContentLoaded', () => {
    hookTrainsCatalog();
});
// public/js/admin-users.js

const usersContainer = document.querySelector('#users-container');
const usersMessage = document.querySelector('#users-message');
const pagination = document.querySelector('#users-pagination');
const previousPageButton = document.querySelector('#users-previous-page');
const nextPageButton = document.querySelector('#users-next-page');
const pageInfo = document.querySelector('#users-page-info');

const editModal = document.querySelector('#edit-user-modal');
const editForm = document.querySelector('#user-edit-form');
const editMessage = document.querySelector('#edit-user-message');
const cancelEditButton = document.querySelector('#cancel-edit-button');
const saveUserButton = document.querySelector('#save-user-button');

const API_URL = '/api/users';
const PAGE_SIZE = 10;
const DEFAULT_SORT = 'username';
const DEFAULT_ORDER = 'asc';

let currentPage = 1;
let currentSort = DEFAULT_SORT;
let currentOrder = DEFAULT_ORDER;
let totalPages = 1;
let users = [];
let editingUserId = null;

function showMessage(message, isError = false) {
    if (!usersMessage) return;

    usersMessage.textContent = message;
    usersMessage.style.color = isError ? '#c33' : '';
}

function showEditMessage(message, isError = false) {
    if (!editMessage) return;

    editMessage.textContent = message;
    editMessage.style.color = isError ? '#c33' : '';
}

async function readResponse(response) {
    const contentType = response.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
        const responseText = await response.text();

        console.error('Expected JSON but received:', {
            status: response.status,
            url: response.url,
            response: responseText.slice(0, 300)
        });

        throw new Error(
            response.redirected
                ? 'Your session may have expired. Please log in again.'
                : `Unexpected server response (${response.status}).`
        );
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
            data.error ||
            `Request failed (${response.status}).`
        );
    }

    return data;
}

function getUserId(user) {
    return user?._id || user?.id;
}

function getRoleId(role) {
    if (role && typeof role === 'object') {
        return String(role.id ?? role._id ?? '1');
    }

    return String(role ?? '1');
}

function getRoleName(role) {
    return getRoleId(role) === '2' ? 'Admin' : 'Customer';
}

function createCell(value) {
    const cell = document.createElement('td');
    cell.textContent = value ?? '—';
    return cell;
}

function createSortButton(label, field) {
    const button = document.createElement('button');
    button.type = 'button';

    const isActive = currentSort === field;
    const arrow = !isActive
        ? ''
        : currentOrder === 'asc'
            ? ' ▲'
            : ' ▼';

    button.textContent = `${label}${arrow}`;

    button.addEventListener('click', () => {
        if (currentSort === field) {
            currentOrder = currentOrder === 'asc' ? 'desc' : 'asc';
        } else {
            currentSort = field;
            currentOrder = DEFAULT_ORDER;
        }

        currentPage = 1;
        loadUsers();
    });

    return button;
}

function createTable() {
    const table = document.createElement('table');
    table.className = 'users-table';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    const columns = [
        { label: 'Display Name', field: 'displayName' },
        { label: 'Username', field: 'username' },
        { label: 'Email', field: 'email' }
    ];

    columns.forEach(({ label, field }) => {
        const th = document.createElement('th');
        th.scope = 'col';

        if (currentSort === field) {
            th.setAttribute(
                'aria-sort',
                currentOrder === 'asc' ? 'ascending' : 'descending'
            );
        } else {
            th.setAttribute('aria-sort', 'none');
        }

        th.appendChild(createSortButton(label, field));
        headerRow.appendChild(th);
    });

    const roleHeader = document.createElement('th');
    roleHeader.scope = 'col';
    roleHeader.textContent = 'Role';
    headerRow.appendChild(roleHeader);

    const actionsHeader = document.createElement('th');
    actionsHeader.scope = 'col';
    actionsHeader.textContent = 'Actions';
    headerRow.appendChild(actionsHeader);

    thead.appendChild(headerRow);

    const tbody = document.createElement('tbody');

    users.forEach((user) => {
        const row = document.createElement('tr');
        const userId = getUserId(user);

        row.dataset.userId = userId;

        row.appendChild(createCell(user.displayName || 'Unnamed user'));
        row.appendChild(createCell(user.username || '—'));
        row.appendChild(createCell(user.email || '—'));
        row.appendChild(createCell(getRoleName(user.role)));

        // Create the Actions cell.
        const actionsCell = document.createElement('td');

        // Create the Edit button.
        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.textContent = 'Edit';
        editButton.addEventListener('click', () => {
            openEditModal(user);
        });

        // Create the Delete button.
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.textContent = 'Delete';
        deleteButton.classList.add('delete-user-button');
        deleteButton.addEventListener('click', () => {
            deleteUser(userId);
        });

        // Append both buttons to the same cell.
        actionsCell.append(editButton, deleteButton);
        row.appendChild(actionsCell);

        tbody.appendChild(row);
    });

    table.append(thead, tbody);

    return table;
}

function renderUsers() {
    usersContainer.replaceChildren();

    if (users.length === 0) {
        const message = document.createElement('p');
        message.textContent = 'No users found.';
        usersContainer.appendChild(message);
    } else {
        usersContainer.appendChild(createTable());
    }

    renderPagination();
}

function renderPagination() {
    if (!pagination) return;

    pagination.hidden = totalPages <= 1;

    previousPageButton.disabled = currentPage <= 1;
    nextPageButton.disabled = currentPage >= totalPages;

    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
}

async function loadUsers() {
    try {
        usersContainer.replaceChildren();

        const loadingMessage = document.createElement('p');
        loadingMessage.textContent = 'Loading users...';
        usersContainer.appendChild(loadingMessage);

        showMessage('');

        const params = new URLSearchParams({
            page: String(currentPage),
            limit: String(PAGE_SIZE),
            sort: currentSort,
            order: currentOrder
        });

        const response = await fetch(`${API_URL}?${params}`, {
            method: 'GET',
            headers: {
                Accept: 'application/json'
            },
            credentials: 'same-origin'
        });

        const result = await readResponse(response);

        if (
            !result ||
            !Array.isArray(result.data) ||
            !result.pagination
        ) {
            throw new Error(
                'The server returned an invalid paginated user list.'
            );
        }

        users = result.data;

        currentPage = Number(result.pagination.page) || currentPage;
        totalPages = Math.max(
            1,
            Number(result.pagination.totalPages) || 0
        );

        renderUsers();
    } catch (error) {
        console.error('Failed to load users:', error);

        usersContainer.replaceChildren();

        const errorMessage = document.createElement('p');
        errorMessage.textContent =
            'Unable to load users. Please try again.';

        usersContainer.appendChild(errorMessage);

        if (pagination) {
            pagination.hidden = true;
        }

        showMessage(
            error.message || 'Failed to load users.',
            true
        );
    }
}

function openEditModal(user) {
    editingUserId = getUserId(user);

    if (!editingUserId) {
        showMessage('Unable to edit a user without an ID.', true);
        return;
    }

    showMessage('');
    showEditMessage('');

    editForm.elements.userId.value = editingUserId;
    editForm.elements.displayName.value = user.displayName || '';
    editForm.elements.username.value = user.username || '';
    editForm.elements.email.value = user.email || '';
    editForm.elements.password.value = '';
    editForm.elements.role.value = getRoleId(user.role);

    saveUserButton.disabled = false;

    editModal.showModal();
}

function closeEditModal() {
    if (editForm) {
        editForm.reset();
    }

    editingUserId = null;
    showEditMessage('');

    if (editModal.open) {
        editModal.close();
    }
}

async function saveUser(event) {
    event.preventDefault();

    if (!editingUserId) {
        showEditMessage('No user selected for editing.', true);
        return;
    }

    const displayName = editForm.elements.displayName.value.trim();
    const email = editForm.elements.email.value.trim();
    const password = editForm.elements.password.value;
    const role = editForm.elements.role.value;

    if (!displayName || !email) {
        showEditMessage('Display name and email are required.', true);
        return;
    }

    if (password && password.length < 8) {
        showEditMessage(
            'The new password must be at least 8 characters.',
            true
        );
        return;
    }

    const updateData = {
        displayName,
        email,
        role
    };

    if (password) {
        updateData.password = password;
    }

    try {
        saveUserButton.disabled = true;
        showEditMessage('Saving user changes...');

        const response = await fetch(
            `${API_URL}/${encodeURIComponent(editingUserId)}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify(updateData)
            }
        );

        const result = await readResponse(response);
        const updatedUser = result.user || result;

        if (!updatedUser || !getUserId(updatedUser)) {
            throw new Error('The server returned an invalid updated user.');
        }

        // Update local data only after the server confirms success.
        users = users.map((user) =>
            getUserId(user) === editingUserId
                ? { ...user, ...updatedUser }
                : user
        );

        closeEditModal();

        // Reload to keep the server-side sort order correct.
        await loadUsers();

        showMessage('User updated successfully.');
    } catch (error) {
        console.error('Failed to update user:', error);

        showEditMessage(
            error.message || 'Failed to update user.',
            true
        );
    } finally {
        if (saveUserButton && editModal.open) {
            saveUserButton.disabled = false;
        }
    }
}

async function deleteUser(userId) {
    if (!userId) {
        showMessage('Unable to delete a user without an ID.', true);
        return;
    }

    const confirmed = window.confirm(
        'Are you sure you want to delete this user? This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
        showMessage('Deleting user...');

        const response = await fetch(
            `${API_URL}/${encodeURIComponent(userId)}`,
            {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json'
                },
                credentials: 'same-origin'
            }
        );

        // Handles non-JSON responses and HTTP errors consistently.
        await readResponse(response);

        // If the last user on this page was deleted, move back one page.
        if (users.length === 1 && currentPage > 1) {
            currentPage -= 1;
        }

        await loadUsers();
        showMessage('User deleted successfully.');
    } catch (error) {
        console.error('Failed to delete user:', error);

        showMessage(
            error.message || 'Failed to delete user.',
            true
        );
    }
}

if (
    usersContainer &&
    usersMessage &&
    pagination &&
    previousPageButton &&
    nextPageButton &&
    pageInfo &&
    editModal &&
    editForm &&
    cancelEditButton &&
    saveUserButton
) {
    previousPageButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage -= 1;
            loadUsers();
        }
    });

    nextPageButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage += 1;
            loadUsers();
        }
    });

    editForm.addEventListener('submit', saveUser);

    cancelEditButton.addEventListener('click', closeEditModal);

    editModal.addEventListener('close', () => {
        if (editForm) {
            editForm.reset();
        }

        editingUserId = null;
        showEditMessage('');
    });

    loadUsers();
}

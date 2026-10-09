// public/js/admin-users.js

const usersContainer = document.querySelector('#users-container');
const usersMessage = document.querySelector('#users-message');
const userCardTemplate = document.querySelector('#user-card-template');

const API_URL = '/api/users';

function showMessage(message, isError = false) {
    usersMessage.textContent = message;
    usersMessage.style.color = isError ? '#c33' : '';
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

function getRoleName(role) {
    return String(role) === '2' ? 'Admin' : 'Customer';
}

function getUserId(user) {
    return user._id || user.id;
}

function createUserCard(user) {
    const fragment = userCardTemplate.content.cloneNode(true);
    const card = fragment.querySelector('.user-card');
    const view = card.querySelector('.user-card-view');
    const form = card.querySelector('.user-edit-form');

    const userId = getUserId(user);

    if (!userId) {
        throw new Error('A user record is missing its ID.');
    }

    card.dataset.userId = userId;

    card.querySelector('.user-name').textContent =
        user.displayName || 'Unnamed user';

    card.querySelector('.user-username').textContent =
        user.username || '—';

    card.querySelector('.user-email').textContent =
        user.email || '—';

    card.querySelector('.user-role').textContent =
        getRoleName(user.role);

    form.querySelector('.edit-display-name').value =
        user.displayName || '';

    form.querySelector('.edit-username').value =
        user.username || '';

    form.querySelector('.edit-email').value =
        user.email || '';

    form.querySelector('.edit-role').value =
        String(user.role ?? '1');

    form.querySelector('.edit-password').value = '';

    card.querySelector('.edit-user-button').addEventListener(
        'click',
        () => {
            usersMessage.textContent = '';
            view.hidden = true;
            form.hidden = false;
        }
    );

    card.querySelector('.cancel-edit-button').addEventListener(
        'click',
        () => {
            form.reset();
            form.querySelector('.edit-display-name').value =
                user.displayName || '';
            form.querySelector('.edit-username').value =
                user.username || '';
            form.querySelector('.edit-email').value =
                user.email || '';
            form.querySelector('.edit-role').value =
                String(user.role ?? '1');
            form.querySelector('.edit-password').value = '';

            form.hidden = true;
            view.hidden = false;
            usersMessage.textContent = '';
        }
    );

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const saveButton = form.querySelector(
            'button[type="submit"]'
        );

        const displayName = form
            .querySelector('.edit-display-name')
            .value.trim();

        const email = form
            .querySelector('.edit-email')
            .value.trim();

        const password = form
            .querySelector('.edit-password')
            .value;

        const role = form
            .querySelector('.edit-role')
            .value;

        if (!displayName || !email) {
            showMessage(
                'Display name and email are required.',
                true
            );
            return;
        }

        if (password && password.length < 8) {
            showMessage(
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

        // Send a password only when the administrator enters one.
        if (password) {
            updateData.password = password;
        }

        try {
            if (saveButton) {
                saveButton.disabled = true;
            }

            showMessage('Saving user changes...');

            const response = await fetch(
                `${API_URL}/${encodeURIComponent(userId)}`,
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

            // Refresh the card using the saved server response.
            card.querySelector('.user-name').textContent =
                updatedUser.displayName ?? displayName;

            card.querySelector('.user-username').textContent =
                updatedUser.username ?? user.username ?? '—';

            card.querySelector('.user-email').textContent =
                updatedUser.email ?? email;

            card.querySelector('.user-role').textContent =
                getRoleName(updatedUser.role ?? role);

            // Keep the form and local record synchronized.
            user.displayName = updatedUser.displayName ?? displayName;
            user.email = updatedUser.email ?? email;
            user.role = String(updatedUser.role ?? role);

            form.querySelector('.edit-display-name').value =
                user.displayName;

            form.querySelector('.edit-email').value = user.email;
            form.querySelector('.edit-role').value = user.role;

            // Never retain the newly entered password in the form.
            form.querySelector('.edit-password').value = '';

            form.hidden = true;
            view.hidden = false;

            showMessage('User updated successfully.');
        } catch (error) {
            console.error('Failed to update user:', error);

            showMessage(
                error.message || 'Failed to update user.',
                true
            );
        } finally {
            if (saveButton) {
                saveButton.disabled = false;
            }
        }
    });

    card.querySelector('.delete-user-button').addEventListener(
        'click',
        async () => {
            const confirmed = window.confirm(
                `Are you sure you want to delete ${user.displayName || user.username || 'this user'}?`
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

                await readResponse(response);

                card.remove();

                if (!usersContainer.querySelector('.user-card')) {
                    usersContainer.innerHTML =
                        '<p>No users found.</p>';
                }

                showMessage('User deleted successfully.');
            } catch (error) {
                console.error('Failed to delete user:', error);

                showMessage(
                    error.message || 'Failed to delete user.',
                    true
                );
            }
        }
    );

    return fragment;
}

async function loadUsers() {
    try {
        usersContainer.innerHTML = '<p>Loading users...</p>';
        showMessage('');

        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                Accept: 'application/json'
            },
            credentials: 'same-origin'
        });

        const users = await readResponse(response);

        if (!Array.isArray(users)) {
            throw new Error('The server returned an invalid user list.');
        }

        usersContainer.replaceChildren();

        if (users.length === 0) {
            usersContainer.innerHTML = '<p>No users found.</p>';
            return;
        }

        const fragment = document.createDocumentFragment();

        users.forEach((user) => {
            fragment.appendChild(createUserCard(user));
        });

        usersContainer.appendChild(fragment);
    } catch (error) {
        console.error('Failed to load users:', error);

        usersContainer.innerHTML =
            '<p>Unable to load users. Please try again.</p>';

        showMessage(
            error.message || 'Failed to load users.',
            true
        );
    }
}

if (usersContainer && usersMessage && userCardTemplate) {
    loadUsers();
}

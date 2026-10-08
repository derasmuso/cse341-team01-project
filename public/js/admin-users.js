// public/js/admin-users.js

const usersMap = new Map();

const usersContainer = document.querySelector('#users-container');
const messageElement = document.querySelector('#users-message');
const userCardTemplate = document.querySelector('#user-card-template');


/***********************************************
 *   Load users from the server and render them
 * *********************************************/

async function loadUsers() {
    try {
        const response = await fetch('/api/users');

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || data.error || 'Failed to load users.');
        }

        usersMap.clear();

        data.forEach((user) => {
            usersMap.set(user._id, user);
        });

        renderUsers();
    } catch (error) {
        showMessage(error.message);
        usersContainer.textContent = '';
    }
}

function renderUsers() {
    usersContainer.textContent = '';

    usersMap.forEach((user) => {
        const card = createUserCard(user);
        usersContainer.appendChild(card);
    });
}

/***********************************************
 *   User card creation and event handling
 * *********************************************/

function createUserCard(user) {
    const fragment = userCardTemplate.content.cloneNode(true);

    const card = fragment.querySelector('.user-card');

    card.dataset.userId = user._id;

    const userName = fragment.querySelector('.user-name');
    const userUsername = fragment.querySelector('.user-username');
    const userEmail = fragment.querySelector('.user-email');
    const userRole = fragment.querySelector('.user-role');

    userName.textContent = user.displayName;
    userUsername.textContent = user.username;
    userEmail.textContent = user.email;
    userRole.textContent = user.role === '2'
        ? 'Admin'
        : 'Customer';

    return card;
}

/***********************************************
 *   User editing
 * *********************************************/

function startEditing(card, user) {
    const view = card.querySelector('.user-card-view');
    const form = card.querySelector('.user-edit-form');

    form.querySelector('.edit-display-name').value = user.displayName;
    form.querySelector('.edit-username').value = user.username;
    form.querySelector('.edit-email').value = user.email;
    form.querySelector('.edit-role').value = user.role;

    view.hidden = true;
    form.hidden = false;
}

function cancelEditing(card) {
    const view = card.querySelector('.user-card-view');
    const form = card.querySelector('.user-edit-form');

    form.hidden = true;
    view.hidden = false;
}

/***********************************************
 *   User saving
 * *********************************************/

async function saveUser(card, originalUser) {
    const form = card.querySelector('.user-edit-form');

    const displayName = form
        .querySelector('.edit-display-name')
        .value
        .trim();

    const email = form
        .querySelector('.edit-email')
        .value
        .trim();

    const role = form.querySelector('.edit-role').value;

    const updateData = {
        displayName,
        email,
        role
    };

    try {
        const response = await fetch(
            `/api/users/${encodeURIComponent(originalUser._id)}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || data.error || 'Failed to update user.'
            );
        }

        usersMap.set(data._id, data);

        renderUsers();

        showMessage('User updated successfully.');
    } catch (error) {
        showMessage(error.message);
    }
}


/***********************************************
 *   User deletion
 * *********************************************/

async function deleteUser(userId) {
    const user = usersMap.get(userId);

    if (!user) {
        return;
    }

    const confirmed = window.confirm(
        `Are you sure you want to delete ${user.displayName}?`
    );

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(
            `/api/users/${encodeURIComponent(userId)}`,
            {
                method: 'DELETE'
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || data.error || 'Failed to delete user.'
            );
        }

        usersMap.delete(userId);

        renderUsers();

        showMessage('User deleted successfully.');
    } catch (error) {
        showMessage(error.message);
    }
}


/***********************************************
 *   Event listeners for user actions
 * *********************************************/

usersContainer.addEventListener('click', async (event) => {
    const button = event.target.closest('button');

    if (!button || !usersContainer.contains(button)) {
        return;
    }

    const card = button.closest('.user-card');

    if (!card) {
        return;
    }

    const userId = card.dataset.userId;
    const user = usersMap.get(userId);

    if (!user) {
        return;
    }

    if (button.classList.contains('edit-user-button')) {
        startEditing(card, user);
        return;
    }

    if (button.classList.contains('cancel-edit-button')) {
        cancelEditing(card);
        return;
    }

    if (button.classList.contains('delete-user-button')) {
        await deleteUser(userId);
    }
});

usersContainer.addEventListener('submit', async (event) => {
    if (!event.target.classList.contains('user-edit-form')) {
        return;
    }

    event.preventDefault();

    const form = event.target;
    const card = form.closest('.user-card');

    if (!card) {
        return;
    }

    const userId = card.dataset.userId;
    const user = usersMap.get(userId);

    if (!user) {
        return;
    }

    await saveUser(card, user);
});

function showMessage(message) {
    messageElement.textContent = message;
}

loadUsers();

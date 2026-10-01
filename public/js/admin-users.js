// src/public/js/admin-users.js

const usersMap = new Map();

const usersContainer = document.querySelector('#users-container');
const messageElement = document.querySelector('#users-message');
const userCardTemplate = document.querySelector('#user-card-template');

async function loadUsers() {
    try {
        const response = await fetch('/api/users');

        if (!response.ok) {
            throw new Error('Failed to load users.');
        }

        const users = await response.json();

        usersMap.clear();

        users.forEach((user) => {
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

function createUserCard(user) {
    const fragment = userCardTemplate.content.cloneNode(true);

    const card = fragment.querySelector('.user-card');

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

    const editButton = fragment.querySelector('.edit-user-button');
    const deleteButton = fragment.querySelector('.delete-user-button');
    const cancelButton = fragment.querySelector('.cancel-edit-button');
    const editForm = fragment.querySelector('.user-edit-form');

    editButton.addEventListener('click', () => {
        startEditing(card, user);
    });

    cancelButton.addEventListener('click', () => {
        cancelEditing(card);
    });

    editForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        await saveUser(card, user);
    });

    deleteButton.addEventListener('click', async () => {
        await deleteUser(user._id);
    });

    return card;
}

/**************************************
 * Starts editing a user card
 * ************************************/

function startEditing(card, user) {
    const view = card.querySelector('.user-card-view');
    const form = card.querySelector('.user-edit-form');

    form.querySelector('.edit-display-name').value =
        user.displayName;

    form.querySelector('.edit-username').value =
        user.username;

    form.querySelector('.edit-email').value =
        user.email;

    form.querySelector('.edit-role').value =
        user.role;

    view.hidden = true;
    form.hidden = false;
}


/**************************************
 * Cancels editing a user card
 * ************************************/

function cancelEditing(card) {
    const view = card.querySelector('.user-card-view');
    const form = card.querySelector('.user-edit-form');

    form.hidden = true;
    view.hidden = false;
}


/* **************************************
 * Saves changes to a user
 * ************************************/

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

    const role = form
        .querySelector('.edit-role')
        .value;

    const updateData = {
        displayName,
        email,
        role
    };

    console.log('Updating user:', originalUser._id);
    console.log('Update data:', updateData);

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

        console.log('Update response:', response.status, data);

        if (!response.ok) {
            throw new Error(
                data.message || 'Failed to update user.'
            );
        }

        usersMap.set(data._id, data);

        renderUsers();

        showMessage('User updated successfully.');
    } catch (error) {
        console.error('Update error:', error);
        showMessage(error.message);
    }
}

/**************************************
 * Deletes a user
 * ************************************/

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
                data.message || 'Failed to delete user.'
            );
        }

        usersMap.delete(userId);

        renderUsers();

        showMessage('User deleted successfully.');
    } catch (error) {
        showMessage(error.message);
    }
}


/**************************************
 * Displays a message to the user
 * ************************************/

function showMessage(message) {
    messageElement.textContent = message;
}


/**************************************
 * Load users when the page opens
 * ************************************/

loadUsers();
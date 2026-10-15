
 // public/js/profile.js

import { deleteUserById } from './user-actions.js';

const profileForm = document.querySelector('#profile-form');
const messageElement = document.querySelector('#profile-message');
const deleteAccountButton = document.querySelector('#delete-account-btn');

function showMessage(message, isError = false) {
    if (!messageElement) return;

    messageElement.textContent = message;
    messageElement.style.color = isError ? '#c33' : '';
}

function getCurrentUserId() {
    const userId = profileForm?.dataset.userId;

    if (!userId) {
        throw new Error(
            'Unable to identify the logged-in user. Check the profile form data-user-id attribute.'
        );
    }

    return userId;
}

async function readResponse(response) {
    const contentType = response.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
        const responseText = await response.text();

        console.error('Expected JSON but received:', {
            status: response.status,
            url: response.url,
            contentType,
            response: responseText.slice(0, 300)
        });

        throw new Error(
            response.redirected
                ? 'Your session may have expired. Please log in again.'
                : `Unexpected server response (${response.status}). Check the API route and server logs.`
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

// Update profile
if (profileForm) {
    profileForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const submitButton = profileForm.querySelector(
            'button[type="submit"]'
        );

        const displayNameInput = profileForm.querySelector('#display-name');
        const emailInput = profileForm.querySelector('#email');
        const passwordInput = profileForm.querySelector('#password');

        const displayName = displayNameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!displayName || !email) {
            showMessage('Display name and email are required.', true);
            return;
        }

        const updateData = { displayName, email };

        if (password) {
            updateData.password = password;
        }

        try {
            showMessage('Saving your changes...');

            if (submitButton) submitButton.disabled = true;

            const currentUserId = getCurrentUserId();

            const response = await fetch(
                `/api/users/${encodeURIComponent(currentUserId)}`,
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

            const data = await readResponse(response);
            const updatedUser = data.user || data;

            displayNameInput.value =
                updatedUser.displayName ?? displayName;

            emailInput.value = updatedUser.email ?? email;
            passwordInput.value = '';

            const welcomeHeading = document.querySelector(
                '#dashboard-welcome'
            );

            if (welcomeHeading) {
                welcomeHeading.textContent =
                    `Welcome, ${updatedUser.displayName ?? displayName}`;
            }

            showMessage('Profile updated successfully.');
        } catch (error) {
            console.error('Profile update failed:', error);
            showMessage(error.message || 'Failed to update profile.', true);
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });
}

// Delete account
if (deleteAccountButton && profileForm) {
    deleteAccountButton.addEventListener('click', async () => {
        try {
            const userId = getCurrentUserId();

            deleteAccountButton.disabled = true;
            showMessage('Deleting your account...');

            const deleted = await deleteUserById(
                userId,
                'Are you sure you want to permanently delete your account? This action cannot be undone.'
            );

            if (deleted) {
                showMessage('Account deleted successfully. Redirecting...');
                window.location.replace('/');
            } else {
                // The user cancelled the confirmation.
                showMessage('');
                deleteAccountButton.disabled = false;
            }
        } catch (error) {
            console.error('Account deletion failed:', error);

            showMessage(
                error.message || 'Failed to delete your account.',
                true
            );

            deleteAccountButton.disabled = false;
        }
    });
}

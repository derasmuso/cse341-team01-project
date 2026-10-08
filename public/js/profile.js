const profileForm = document.querySelector('#profile-form');
const messageElement = document.querySelector('#profile-message');

profileForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const displayName = profileForm
        .querySelector('#display-name')
        .value
        .trim();

    const email = profileForm
        .querySelector('#email')
        .value
        .trim();

    const password = profileForm
        .querySelector('#password')
        .value;

    const updateData = {
        displayName,
        email
    };

    if (password) {
        updateData.password = password;
    }

    try {
        const response = await fetch('/api/users/<%= user._id %>', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(updateData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                data.error ||
                'Failed to update profile.'
            );
        }

        messageElement.textContent =
            'Profile updated successfully.';

        profileForm.querySelector('#password').value = '';

    } catch (error) {
        messageElement.textContent = error.message;
    }
});
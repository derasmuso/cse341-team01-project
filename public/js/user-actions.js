
export async function deleteUserById(
    userId,
    confirmationMessage = 'Are you sure you want to delete this user? This action cannot be undone.'
) {
    if (!userId) {
        throw new Error('Unable to delete a user without an ID.');
    }

    const confirmed = window.confirm(confirmationMessage);

    if (!confirmed) {
        return false;
    }

    const response = await fetch(
        `/api/users/${encodeURIComponent(userId)}`,
        {
            method: 'DELETE',
            headers: {
                Accept: 'application/json',
            },
            credentials: 'same-origin',
        }
    );

    // Handle non-JSON responses and HTTP errors.
    if (!response.ok) {
        let result = {};

        try {
            result = await response.json();
        } catch {
            // The response may not contain JSON.
        }

        throw new Error(
            result.message || 'Failed to delete user.'
        );
    }

    return true;
}

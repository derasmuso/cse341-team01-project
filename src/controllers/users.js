// src/controllers/users.js

import mongoose from "mongoose";

import {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser
} from "../models/users.js";

const allowedUpdateFields = [
    "displayName",
    "email",
    "password",
    "role"
];

const validRoles = ["1", "2"];
const ADMIN_ROLE = "2";


/*******************************************
 * Get all users or a single user by ID
 * *************************************** */

export async function getUsers(req, res, next) {
    try {
        /*
         * Admins can view all users.
         */
        if (req.user.role === ADMIN_ROLE) {
            const users = await getAllUsers();

            return res.status(200).json(users);
        }

        /*
         * Regular users can only view their own information.
         */
        const user = await getUserById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.status(200).json([user]);
    } catch (error) {
        return next(error);
    }
}


/*******************************************
 * Update user by ID
 * *************************************** */

export async function updateUserById(req, res, next) {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            message: "Invalid user ID"
        });
    }

    /*
     * Regular users can only update their own account.
     * Admins can update any user.
     */
    if (req.user.role !== ADMIN_ROLE && req.user.id !== id) {
        return res.status(403).json({
            message: "You are not authorized to update this user"
        });
    }

    const fields = Object.keys(req.body);

    if (fields.length === 0) {
        return res.status(400).json({
            message: "No update data provided"
        });
    }

    /*
     * Username and all other unspecified fields are not
     * allowed to be updated.
     */
    if (fields.some((field) => !allowedUpdateFields.includes(field))) {
        return res.status(400).json({
            message: "Invalid user data"
        });
    }

    /*
     * Regular users cannot change their role.
     */
    if (
        req.user.role !== ADMIN_ROLE &&
        fields.includes("role")
    ) {
        return res.status(403).json({
            message: "You are not authorized to change the user role"
        });
    }

    const {
        displayName,
        email,
        password,
        role
    } = req.body;

    if (
        displayName !== undefined &&
        (typeof displayName !== "string" || !displayName.trim())
    ) {
        return res.status(400).json({
            message: "Invalid displayName"
        });
    }

    if (
        email !== undefined &&
        (typeof email !== "string" || !email.trim())
    ) {
        return res.status(400).json({
            message: "Invalid email"
        });
    }

    if (
        password !== undefined &&
        (typeof password !== "string" || password.length < 8)
    ) {
        return res.status(400).json({
            message: "Password must be at least 8 characters"
        });
    }

    if (
        role !== undefined &&
        !validRoles.includes(role)
    ) {
        return res.status(400).json({
            message: "Invalid role"
        });
    }

    try {
        const updateData = {};

        if (displayName !== undefined) {
            updateData.displayName = displayName.trim();
        }

        if (email !== undefined) {
            updateData.email = email.trim().toLowerCase();
        }

        if (password !== undefined) {
            updateData.password = password;
        }

        if (role !== undefined) {
            updateData.role = role;
        }

        const user = await updateUser(id, updateData);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.status(200).json(user);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                message: "Email is already in use"
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: "Invalid user data"
            });
        }

        return next(error);
    }
}


/*******************************************
 * Delete user by ID
 * *************************************** */

export async function deleteUserById(req, res, next) {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            message: "Invalid user ID"
        });
    }

    /*
     * Regular users can only delete their own account.
     * Admins can delete any user.
     */
    if (req.user.role !== ADMIN_ROLE && req.user.id !== id) {
        return res.status(403).json({
            message: "You are not authorized to delete this user"
        });
    }

    try {
        const user = await deleteUser(id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.status(200).json(user);
    } catch (error) {
        return next(error);
    }
}
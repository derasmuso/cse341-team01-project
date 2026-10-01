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
    "role"
];

const validRoles = ["1", "2"];

export async function getUsers(req, res, next) {
    try {
        if (req.user.role === "admin") {
            const users = await getAllUsers();

            return res.status(200).json(users);
        }

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

export async function updateUserById(req, res, next) {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            message: "Invalid user ID"
        });
    }

    // Regular users can only update their own account.
    if (req.user.role !== "admin" && req.user.id !== id) {
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

    if (fields.some((field) => !allowedUpdateFields.includes(field))) {
        return res.status(400).json({
            message: "Invalid user data"
        });
    }

    // Regular users cannot change their role.
    if (req.user.role !== "admin" && fields.includes("role")) {
        return res.status(403).json({
            message: "You are not authorized to change the user role"
        });
    }

    const { displayName, username, email, role } = req.body;

    if (
        displayName !== undefined &&
        (typeof displayName !== "string" || !displayName.trim())
    ) {
        return res.status(400).json({
            message: "Invalid displayName"
        });
    }

    if (
        username !== undefined &&
        (typeof username !== "string" || !username.trim())
    ) {
        return res.status(400).json({
            message: "Invalid username"
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

        if (username !== undefined) {
            updateData.username = username.trim();
        }

        if (email !== undefined) {
            updateData.email = email.trim().toLowerCase();
        }

        if (role !== undefined) {
            updateData.role = role.trim();
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
                message: "Username or email is already in use"
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

export async function deleteUserById(req, res, next) {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            message: "Invalid user ID"
        });
    }

    // Regular users can only delete their own account.
    if (req.user.role !== "admin" && req.user.id !== id) {
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
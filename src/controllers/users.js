// src/controllers/users.js

import mongoose from 'mongoose';

import {
  getPaginatedUsers,
  getUserById,
  updateUser,
  deleteUser,
} from '../models/users.js';

const allowedUpdateFields = ['displayName', 'email', 'password', 'role'];

const validRoles = ['1', '2'];
const ADMIN_ROLE = '2';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const DEFAULT_SORT = 'username';
const DEFAULT_ORDER = 'asc';

const ALLOWED_SORT_FIELDS = ['username', 'displayName', 'email'];

/*******************************************
 * Validate pagination integers
 *******************************************/
function parsePositiveInteger(
  value,
  defaultValue,
  max = Number.MAX_SAFE_INTEGER
) {
  if (value === undefined) {
    return defaultValue;
  }

  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    return null;
  }

  const parsedValue = Number(value);

  if (
    !Number.isSafeInteger(parsedValue) ||
    parsedValue < 1 ||
    parsedValue > max
  ) {
    return null;
  }

  return parsedValue;
}

/*******************************************
 * Get paginated users
 *******************************************/
export async function getUsers(req, res, next) {
  const page = parsePositiveInteger(req.query.page, DEFAULT_PAGE);
  const limit = parsePositiveInteger(req.query.limit, DEFAULT_LIMIT, MAX_LIMIT);

  if (page === null) {
    return res.status(400).json({
      message: 'Invalid page. Page must be a positive integer.',
    });
  }

  if (limit === null) {
    return res.status(400).json({
      message: `Invalid limit. Limit must be an integer between 1 and ${MAX_LIMIT}.`,
    });
  }

  const sort = req.query.sort ?? DEFAULT_SORT;
  const order = req.query.order ?? DEFAULT_ORDER;

  if (typeof sort !== 'string' || !ALLOWED_SORT_FIELDS.includes(sort)) {
    return res.status(400).json({
      message: `Invalid sort field. Allowed fields: ${ALLOWED_SORT_FIELDS.join(', ')}.`,
    });
  }

  if (typeof order !== 'string' || !['asc', 'desc'].includes(order)) {
    return res.status(400).json({
      message: 'Invalid order. Order must be either asc or desc.',
    });
  }

  try {
    /*
     * Admins can view all users.
     * Regular users can only view their own account.
     */
    const filter = req.user.role === ADMIN_ROLE ? {} : { _id: req.user.id };

    const result = await getPaginatedUsers({
      page,
      limit,
      sort,
      order,
      filter,
    });

    /*
     * Preserve the existing behavior when the authenticated
     * user's account cannot be found.
     */
    if (req.user.role !== ADMIN_ROLE && result.pagination.totalItems === 0) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

/*******************************************
 * Update user by ID
 *******************************************/
export async function updateUserById(req, res, next) {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      message: 'Invalid user ID',
    });
  }

  /*
   * Regular users can only update their own account.
   * Admins can update any user.
   */
  if (req.user.role !== ADMIN_ROLE && req.user.id !== id) {
    return res.status(403).json({
      message: 'You are not authorized to update this user',
    });
  }

  const fields = Object.keys(req.body);

  if (fields.length === 0) {
    return res.status(400).json({
      message: 'No update data provided',
    });
  }

  /*
   * Only explicitly allowed fields can be updated.
   */
  if (fields.some((field) => !allowedUpdateFields.includes(field))) {
    return res.status(400).json({
      message: 'Invalid user data',
    });
  }

  /*
   * Regular users cannot change their role.
   */
  if (req.user.role !== ADMIN_ROLE && fields.includes('role')) {
    return res.status(403).json({
      message: 'You are not authorized to change the user role',
    });
  }

  const { displayName, email, password, role } = req.body;

  if (
    displayName !== undefined &&
    (typeof displayName !== 'string' || !displayName.trim())
  ) {
    return res.status(400).json({
      message: 'Invalid displayName',
    });
  }

  if (email !== undefined && (typeof email !== 'string' || !email.trim())) {
    return res.status(400).json({
      message: 'Invalid email',
    });
  }

  if (
    password !== undefined &&
    (typeof password !== 'string' || password.length < 8)
  ) {
    return res.status(400).json({
      message: 'Password must be at least 8 characters',
    });
  }

  if (role !== undefined && !validRoles.includes(role)) {
    return res.status(400).json({
      message: 'Invalid role',
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
        message: 'User not found',
      });
    }

    /*
     * Synchronize the session when the logged-in user
     * updates their own account.
     */
    if (String(req.user.id) === String(id) && req.session.user) {
      req.session.user.displayName = user.displayName;
      req.session.user.email = user.email;

      await new Promise((resolve, reject) => {
        req.session.save((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    }

    return res.status(200).json(user);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'Email is already in use',
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Invalid user data',
      });
    }

    return next(error);
  }
}

/*******************************************
 * Delete user by ID
 *******************************************/
export async function deleteUserById(req, res, next) {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      message: 'Invalid user ID',
    });
  }

  /*
   * Regular users can only delete their own account.
   * Admins can delete any user.
   */
  if (req.user.role !== ADMIN_ROLE && req.user.id !== id) {
    return res.status(403).json({
      message: 'You are not authorized to delete this user',
    });
  }

  try {
    const user = await deleteUser(id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    return res.status(200).json(user);
  } catch (error) {
    return next(error);
  }
}

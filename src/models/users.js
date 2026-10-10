// src/models/users.js

import bcrypt from 'bcrypt';
import User from './schemas/users.js';
import { getRoleByName } from './roles.js';

/*******************************************
 * Create a new user
 *******************************************/
export async function createUser({ displayName, username, email, password }) {
  const customerRole = await getRoleByName('customer');

  if (!customerRole) {
    throw new Error('Default role not found');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({
    displayName,
    username,
    email,
    passwordHash,
    role: customerRole.id,
  });

  return user._id.toString();
}

/*******************************************
 * Find a user by email
 *******************************************/
export async function findUserByEmail(email) {
  return User.findOne({ email }).populate({
    path: 'role',
    foreignField: 'id',
  });
}

export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

/*******************************************
 * Manage users
 *******************************************/

// Get all users (existing, non-paginated function)
export async function getAllUsers() {
  return User.find().select('-passwordHash').lean();
}

/*******************************************
 * Get paginated users
 *******************************************/

// Only allow fields that are safe and supported for sorting.
const ALLOWED_SORT_FIELDS = ['username', 'displayName', 'email'];

export async function getPaginatedUsers({
  page = 1,
  limit = 10,
  sort = 'username',
  order = 'asc',
  filter = {},
} = {}) {
  if (!Number.isInteger(page) || page < 1) {
    throw new Error('Page must be a positive integer');
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error('Limit must be an integer between 1 and 100');
  }

  if (!ALLOWED_SORT_FIELDS.includes(sort)) {
    throw new Error(
      `Invalid sort field. Allowed fields: ${ALLOWED_SORT_FIELDS.join(', ')}`
    );
  }

  if (!['asc', 'desc'].includes(order)) {
    throw new Error('Order must be either asc or desc');
  }

  const skip = (page - 1) * limit;
  const sortDirection = order === 'asc' ? 1 : -1;

  const [users, totalItems] = await Promise.all([
    User.find(filter)
      .select('-passwordHash')
      .sort({ [sort]: sortDirection, _id: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    User.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalItems / limit);

  return {
    data: users,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

/*******************************************
 * Get a user by ID
 *******************************************/
export async function getUserById(id) {
  return User.findById(id).select('-passwordHash').lean();
}

/*******************************************
 * Update a user by ID
 *******************************************/
export async function updateUser(id, data) {
  const updateData = { ...data };

  if (updateData.email !== undefined) {
    updateData.email = updateData.email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: updateData.email,
      _id: { $ne: id },
    })
      .select('_id')
      .lean();

    if (existingUser) {
      const error = new Error('Email is already in use');
      error.code = 11000;
      throw error;
    }
  }

  if (updateData.password !== undefined) {
    updateData.passwordHash = await bcrypt.hash(updateData.password, 12);
    delete updateData.password;
  }

  return User.findOneAndUpdate(
    { _id: id },
    { $set: updateData },
    {
      returnDocument: 'after',
      runValidators: true,
    }
  )
    .select('-passwordHash')
    .lean();
}

/*******************************************
 * Delete a user by ID
 *******************************************/
export async function deleteUser(id) {
  return User.findByIdAndDelete(id).select('-passwordHash').lean();
}

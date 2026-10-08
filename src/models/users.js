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

// Get all users
export async function getAllUsers() {
    return User.find()
        .select("-passwordHash")
        .lean();
}

// Get a user by ID
export async function getUserById(id) {
    return User.findById(id)
        .select("-passwordHash")
        .lean();
}

// Update a user by ID
export async function updateUser(id, data) {
  const updateData = { ...data };

  if (updateData.password !== undefined) {
    updateData.passwordHash = await bcrypt.hash(updateData.password, 12);

    delete updateData.password;
  }

  return User.findByIdAndUpdate(
      id,
      updateData,
      {
          new: true,
          runValidators: true
      }
  )
      .select("-passwordHash")
      .lean();
}

// Delete a user by ID
export async function deleteUser(id) {
    return User.findByIdAndDelete(id)
        .select("-passwordHash")
        .lean();
}


import bcrypt from 'bcrypt';
import User from './schemas/users.js';
import { getRoleByName } from './roles.js';

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

export async function findUserByEmail(email) {
  return User.findOne({ email }).populate({
    path: 'role',
    foreignField: 'id',
  });
}

export async function verifyPassword(password, passwordHash) {
    return bcrypt.compare(password, passwordHash);
}

// User management

export async function getAllUsers() {
    return User.find()
        .select("-passwordHash")
        .lean();
}

export async function getUserById(id) {
    return User.findById(id)
        .select("-passwordHash")
        .lean();
}

export async function updateUser(id, data) {
    return User.findByIdAndUpdate(
        id,
        data,
        {
            new: true,
            runValidators: true
        }
    )
        .select("-passwordHash")
        .lean();
}

export async function deleteUser(id) {
    return User.findByIdAndDelete(id)
        .select("-passwordHash")
        .lean();
}


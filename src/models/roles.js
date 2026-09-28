import Role from "./schemas/roles.js";

export async function getRoleByName(name) {
    return Role.findOne({ name }).lean();
}

export async function getAllRoles() {
    return Role.find({}).lean();
}
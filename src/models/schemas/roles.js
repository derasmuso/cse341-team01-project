import mongoose from "mongoose";

const roleSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    name: {
        type: String,
        enum: ["customer", "admin"],
        unique: true,
        required: true,
    },
});

const Role = mongoose.model("Role", roleSchema);

export default Role;
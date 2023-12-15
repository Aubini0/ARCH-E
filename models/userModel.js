import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: false,
    },
    first_name: {
        type: String,
        required: true,
    },
    last_name: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
    },
    age: {
        type: String,
        required: true,
    },
    ip: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        minLength: 6,
        required: false,
    },
    phone: {
        type: String,
        maxLength: 15,
        required: false,
    },
    profilePic: {
        type: String,
        default: "",
    },
    followers: {
        type: [String],
        default: [],
    },
    following: {
        type: [String],
        default: [],
    },
    bio: {
        type: String,
        default: "",
    },
    isFrozen: {
        type: Boolean,
        default: false,
    },

    // location Cordinated of user
    lat: {
        type: String,
        default: "",
    },
    long: {
        type: String,
        default: "",
    },

}, {
    timestamps: true,
});

const User = mongoose.model("User", userSchema);

export default User;
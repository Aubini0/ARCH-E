import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: false,
    },
    full_name: {
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
        required: false,
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

    // Google Tokens 
    google_access_token : {
        type : String,
        default : ""
    },

    google_refresh_token : {
        type : String,
        default : ""
    },

    spotify_access_token : {
        type : String,
        default : ""
    },

    spotify_refresh_token : {
        type : String,
        default : ""
    },


    broadCastChannelName : {
        type : String,
        default : ""
    },

    broadCastName : {
        type : String,
        default : ""
    },

    broadCastShareId : {
        type : String,
        default : ""
    },

    broadCastStatus : {
        type : Boolean,
        default : false
    },
    broadcastListeners: {
        type: [Object],
        default: [],
    },





    access_roles : {
        type: [String],
        default: [ "user" ],        
    },

    isSuperAdmin : {
        type : Boolean,
        default : false
    }

}, {
    timestamps: true,
});

const User = mongoose.model("User", userSchema);

export default User;
import mongoose from "mongoose";

const commentSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        required: true,
    },

    text: {
        type: String,
        required: true,
    },

    userProfilePic: {
        type: String,
    },

    username: {
        type: String,
        required : true,
    },


    parentReply : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    }



}, {
    timestamps: true,
});

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;

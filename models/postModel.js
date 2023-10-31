import mongoose from "mongoose";

const postSchema = mongoose.Schema({
	postedBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	postedFrom: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		default: null,
	},
	parentPost: {	
		type: mongoose.Schema.Types.ObjectId,
		ref: "Post",
		default: null,
	},
	repostCount: {
		type: Number,
		default: 0,
	},
	text: {
		type: String,
		maxLength: 500,
	},
	audio: {
		type: String,
		required: true,
	},
	img: {
		type: String,
	},
	likes: {
		type: [mongoose.Schema.Types.ObjectId],
		ref: "User",
		default: [],
	},
	replies: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Reply",
		},
	],
}, {
	timestamps: true,
});

const Post = mongoose.model("Post", postSchema);

export default Post;

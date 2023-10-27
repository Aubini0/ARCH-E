import Post from "../models/postModel.js";
import User from "../models/userModel.js";


const createRepost = async(req, res) => {
    try {
        const { postedBy, text, parentPost, postedFrom } = req.body;
        let { img } = req.body;

        if (!postedBy || !text) {
            return res.status(400).json({ error: "Postedby and text fields are required" });
        }

        const user = await User.findById(postedBy);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user._id.toString() !== req.user._id.toString()) {
            return res.status(401).json({ error: "Unauthorized to create post" });
        }

        const maxLength = 500;
        if (text.length > maxLength) {
            return res.status(400).json({ error: `Text must be less than ${maxLength} characters` });
        }

        if (img) {
            const uploadedResponse = await cloudinary.uploader.upload(img);
            img = uploadedResponse.secure_url;
        }

        const newPost = new Post({ postedBy, text, img, parentPost, postedFrom });
        await newPost.save();

        res.status(201).json(newPost);
    } catch (err) {
        res.status(500).json({ error: err.message });

    }
}

const getUserReposts = async(req, res) => {
    const { username } = req.params;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const posts = await Post.find({ postedBy: user._id });

        const reposts = posts
            .filter((post) => post.postedFrom !== null)
            .map((post) => {
                return {
                    _id: post._id,
                    text: post.text,
                    postedBy: {
                        _id: post.postedBy._id,
                    },
                    postedFrom: {
                        _id: post.postedFrom._id,
                    },
                    createdAt: post.createdAt,
                };
            });

        res.status(200).json(reposts);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


export { createRepost, getUserReposts };
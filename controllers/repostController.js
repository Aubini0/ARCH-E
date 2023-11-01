import Post from "../models/postModel.js";
import User from "../models/userModel.js";


const createRepost = async(req, res) => {
    try {
        console.log("req.body", req.body);
        const { postedBy, text, parentPost, audio, postedFrom } = req.body;
        let { img } = req.body;

        if (!postedBy || !text || !audio) {
            return res.status(400).json({ error: "Postedby, text or audio fields are required" });
        }

        const user = await User.findById(postedBy);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const maxLength = 500;
        if (text.length > maxLength) {
            return res.status(400).json({ error: `Text must be less than ${maxLength} characters` });
        }


        const newPost = new Post({ postedBy, text, audio, parentPost, postedFrom });
        await newPost.save();

        if (parentPost) {
            console.log("parentPost", parentPost);
            const parent = await Post.findById(parentPost);
            if (parent) {
                parent.repostCount += 1;
                await parent.save();
            }
        }

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
                    postedBy: post.postedBy._id,
                    postedFrom: post.postedFrom._id,
                    createdAt: post.createdAt,
                };
            });

        res.status(200).json(reposts);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


export { createRepost, getUserReposts };
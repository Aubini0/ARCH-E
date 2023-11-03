import Post from "../models/postModel.js";
import User from "../models/userModel.js";
import Reply from "../models/replyModel.js";
import dotenv from "dotenv";
dotenv.config();
import { v4 as uuidv4 } from "uuid";
import { upload, s3 } from "../db/bucketUploadClient.js";
import { Types } from 'mongoose'; // Import Types from mongoose

const createPost = async(req, res) => {
    try {
        console.log("creat req.body", req.body);
        if (!req.body.audio) {
            return res.status(400).json({ error: 'No audio file provided.' });
        }
        const audioData = Buffer.from(req.body.audio, 'base64');
        const fileName = uuidv4() + '.mp3'; // Generate a unique filename

        const params = {
            Bucket: "amplifibucketfiles",
            Key: fileName,
            Body: audioData,
            ContentType: "audio/mp3",
            ACL: "public-read"
        };

        // Upload the audio file to S3 and get the location


        const { Location, Key } = await s3.upload(params).promise();
        let location = Location;
        let key = Key;
        console.log(location)

        // Save the audio URL to the database
        const audioPath = location;
        const { title, postedBy } = req.body;
        console.log("postedBy", postedBy);
        console.log("title", title);

        // Assuming you have a database model named "AudioPost" for audio posts
        const post = new Post({
            postedBy: postedBy,
            text: title,
            audio: audioPath
        });
        console.log("post", post);
        await post.save();

        return res.status(201).json(post);

    } catch (error) {
        console.error('Error saving audio data:', error);
        res.status(500).json({ error: 'Error saving audio data' });
    }
};


// Update a post
const updatePost = async(req, res) => {
    const { postId } = req.params; // Assuming you have a route parameter for postId
    const { title, postedBy } = req.body;

    try {
        const updatedPost = await Post.findByIdAndUpdate(
            postId, { title, postedBy }, { new: true }
        );

        if (!updatedPost) {
            return res.status(404).json({ error: 'Post not found' });
        }

        res.json(updatedPost);
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ error: 'Error updating post' });
    }
};

// Fetch all posts
const getAllPosts = async(req, res) => {
    try {
        const posts = await Post.find();
        res.json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Error fetching posts' });
    }
};

// Fetch a specific post by ID
const getPostById = async(req, res) => {
    const { postId } = req.params;

    try {
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        res.json(post);
    } catch (error) {
        console.error('Error fetching post by ID:', error);
        res.status(500).json({ error: 'Error fetching post by ID' });
    }
};


// Search for posts by title
const searchPostsByTitle = async(req, res) => {
    const { searchTerm } = req.query;
    try {
        const posts = await Post.find({
            title: { $regex: searchTerm, $options: 'i' }, // Case-insensitive title search
        });

        res.json(posts);
    } catch (error) {
        console.error('Error searching for posts by title:', error);
        res.status(500).json({ error: 'Error searching for posts by title' });
    }
};


const getPost = async(req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        console.log("get post", post);

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        res.status(200).json(post);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteComment = async(req, res) => {
    try {
        const postId = req.params.id;
        const replyId = req.params.replyId;

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        const replyIndex = post.replies.findIndex((reply) => reply._id.toString() === replyId);

        if (replyIndex !== -1) {
            post.replies.splice(replyIndex, 1);
            await post.save();
            return res.status(200).json({ message: "Reply deleted successfully" });
        } else {
            return res.status(404).json({ error: "Reply not found" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

const deletePost = async(req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        if (post.postedBy.toString() !== req.user._id.toString()) {
            return res.status(401).json({ error: "Unauthorized to delete post" });
        }

        if (post.img) {

            let img = post.img.split(".com/")[1]
            const params_remove_req = {
                Bucket: process.env.AWSS3BUCKETNAME,
                Key: img,
            }

            s3.deleteObject(params_remove_req, function(err, data) {
                if (err) console.log(err, err.stack);
                else console.log(data);
            });
            // const imgId = post.img.split("/").pop().split(".")[0];
            // await cloudinary.uploader.destroy(imgId);
        }

        await Post.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: "Post deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const likeUnlikePost = async(req, res) => {
    try {
        const { id: postId } = req.params;
        const userId = req.user._id;

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        const userLikedPost = post.likes.includes(userId);

        if (userLikedPost) {

            await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
            res.status(200).json({ message: "Post unliked successfully" });
        } else {

            post.likes.push(userId);
            await post.save();
            res.status(200).json({ message: "Post liked successfully" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const replyToPost = async(req, res) => {
    try {
        const { ObjectId } = Types;

        console.log("req.body", req.body);
        const { text, user } = req.body;
        const postId = req.params.id;
        const userId = new ObjectId(user._id);
        const userProfilePic = user.profilePic;
        const username = user.username;

        console.log("user", user);
        console.log("userProfilePic", userProfilePic);
        console.log("username", username);
        console.log("userId", userId);

        console.log("text", text);

        if (!text) {
            return res.status(400).json({ error: "Text field is required" });
        }

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }
        const replyId = new ObjectId();
        const reply = {
            _id: replyId,
            userId: userId,
            text: text,
            userProfilePic: userProfilePic,
            username: username,
        };
        console.log("post before :", post)
        console.log("final reply", reply);
        // await reply.save(); // Save the reply document

        // Push the reply into the post's replies array

        const update = {
            $push: { replies: reply },
        };

        const updatedPost = await Post.updateOne({ _id: postId }, update);
        console.log("updatedPost", updatedPost);
        if (updatedPost.modifiedCount === 1) {
            const replyWithId = reply;
            console.log("replyWithId", replyWithId);
            res.status(200).json(replyWithId);
        } else {
            res.status(404).json({ error: "Post not updated" });
        }

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


const getFeedPosts = async (req, res) => {
  try {
    let isAuthenticated = false;
    let userId = req.params.id || null; // Set userId to null if id is not provided
    let user = null;
    
    if (userId) {
      console.log("UserId", userId);

            user = await User.findById(userId);
            console.log("user", user);

            if (user) {
                isAuthenticated = true;
            }
        }

        console.log("isAuthenticated", isAuthenticated);

        // Initial match stage to filter out the user's own posts
        let matchStage = {};
        if (isAuthenticated) {
            matchStage = {
                $match: {
                    postedBy: { $nin: [userId] }, // Exclude the user's own posts
                },
            };
        }

        console.log("matchStage", matchStage);

        // Sample stage to get a random sample of 10 posts
        const sampleStage = { $sample: { size: 10 } };

        console.log("sampleStage", sampleStage);

        // Aggregate the pipeline
        const pipeline = [];

    if (matchStage.$match) {
      pipeline.push(matchStage);
    }
    pipeline.push(sampleStage);
    
    const randomFeedPosts = await Post.aggregate(pipeline);
    console.log("randomFeedPosts", randomFeedPosts);

        if (!randomFeedPosts || randomFeedPosts.length === 0) {
            return res.status(404).json({ error: "No feed posts found" });
        }

        res.status(200).json(randomFeedPosts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};




const getUserPosts = async(req, res) => {
    const { username } = req.params;

    try {
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const posts = await Post.find({ postedBy: user._id }).sort({ createdAt: -1 });

        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ error: error.message });

    }
};

const upvotePost = async (req, res) => {
  const { postId, userId } = req.params;

  try {
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (!post.upVote.includes(userId)) {
      post.upVote.push(userId);

      const downVoteIndex = post.downVote.indexOf(userId);
      console.log("downVoteIndex", downVoteIndex);
      if (downVoteIndex !== -1) {
        post.downVote.splice(downVoteIndex, 1);
      }

      await post.save();

      return res.status(200).json(post);
    } else {
      return res.status(400).json({ error: 'You already upvoted this post' });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Controller function for downvoting a post
const downvotePost = async (req, res) => {
  const { postId, userId } = req.params;

  try {
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (!post.downVote.includes(userId)) {
      post.downVote.push(userId);

      const upVoteIndex = post.upVote.indexOf(userId);
      if (upVoteIndex !== -1) {
        post.upVote.splice(upVoteIndex, 1);
      }

      await post.save();

      return res.status(200).json(post);
    } else {
      return res.status(400).json({ error: 'You already downvoted this post' });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export { createPost, getPost, deletePost, likeUnlikePost, replyToPost, getFeedPosts, getUserPosts, deleteComment, getAllPosts, upvotePost, downvotePost };
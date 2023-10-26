import Post from "../models/postModel.js";
import User from "../models/userModel.js";
import dotenv from "dotenv";
dotenv.config();
import { v4 as uuidv4 } from "uuid";
import { upload, s3 } from "../db/bucketUploadClient.js";






const createPost = async (req, res) => {
  try {
    if (!req.body.audio) {
      return res.status(400).json({ error: 'No audio file provided.' });
    }
	 const audioData = Buffer.from(req.body.audio, 'base64');
    const fileName = uuidv4() + '.mp3'; // Generate a unique filename

    const params = {
      Bucket: process.env.AWSS3BUCKETNAME,
      Key: fileName,
      Body: audioData,
      ACL: 'public-read', 
    };

       // Upload the audio file to S3 and get the location

	   let location = '';
	   let key = '';
	
		const { Location, Key } = await s3.upload(params).promise();
		location = Location;
		key = Key;
		console.log(location)

	   // Save the audio URL to the database
	   const audioPath = location;
	   const { title, postedBy } = req.body;
   
	   // Assuming you have a database model named "AudioPost" for audio posts
	   const post = new Post({
		 postedBy: postedBy,
		 title,
		 audio: audioPath
	   });
       await post.save();

         return res.status(201).json(post);
  
  } catch (error) {
    console.error('Error saving audio data:', error);
    res.status(500).json({ error: 'Error saving audio data' });
  }
};










// Update a post
const updatePost = async (req, res) => {
	const { postId } = req.params; // Assuming you have a route parameter for postId
	const { title, postedBy } = req.body;
  
	try {
	  const updatedPost = await Post.findByIdAndUpdate(
		postId,
		{ title, postedBy },
		{ new: true }
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
  const getAllPosts = async (req, res) => {
	try {
	  const posts = await Post.find();
	  res.json(posts);
	} catch (error) {
	  console.error('Error fetching posts:', error);
	  res.status(500).json({ error: 'Error fetching posts' });
	}
  };
  
  // Fetch a specific post by ID
  const getPostById = async (req, res) => {
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
const searchPostsByTitle = async (req, res) => {
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
  





const getPost = async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);

		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		res.status(200).json(post);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

const deleteComment = async (req, res) => {
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

const deletePost = async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);
		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		if (post.postedBy.toString() !== req.user._id.toString()) {
			return res.status(401).json({ error: "Unauthorized to delete post" });
		}

		if (post.img) {
			const imgId = post.img.split("/").pop().split(".")[0];
			await cloudinary.uploader.destroy(imgId);
		}

		await Post.findByIdAndDelete(req.params.id);

		res.status(200).json({ message: "Post deleted successfully" });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

const likeUnlikePost = async (req, res) => {
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

const replyToPost = async (req, res) => {
	try {
		const { text } = req.body;
		const postId = req.params.id;
		const userId = req.user._id;
		const userProfilePic = req.user.profilePic;
		const username = req.user.username;

		if (!text) {
			return res.status(400).json({ error: "Text field is required" });
		}

		const post = await Post.findById(postId);

		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		const reply = { userId, text, userProfilePic, username };

		post.replies.push(reply);

		await post.save();


		res.status(200).json(reply);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

const getFeedPosts = async (req, res) => {
	try {
		const userId = req.user._id;
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		const following = user.following;

		const feedPosts = await Post.find({ postedBy: { $in: following } }).sort({ createdAt: -1 });

		res.status(200).json(feedPosts);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

const getUserPosts = async (req, res) => {
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


export { createPost, getPost, deletePost, likeUnlikePost, replyToPost, getFeedPosts, getUserPosts, deleteComment };

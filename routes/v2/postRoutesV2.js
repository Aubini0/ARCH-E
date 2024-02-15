import express from "express";
import {
    deletePostV2,
    createPostV2,
    replyToPostV2,
    getShareUrlV2,
    getFeedPostsV2,    
    deleteCommentV2,
    likeUnlikePostV2,
    getPostCommentsV2,
    getPostFromShareUrlV2,
    getFollowedFeedPostsV2
} from "../../controllers/v2/postControllerV2.js";
import protectRoute from "../../middlewares/protectRoute.js";


const router = express.Router();

// Private Routes
// create post
router.post("/create", protectRoute, createPostV2);
// like post
router.put("/like/:postId", protectRoute, likeUnlikePostV2);
// comment on a post
router.post("/comment", protectRoute, replyToPostV2);
// get followed people posts
router.get("/followed-feed", protectRoute , getFollowedFeedPostsV2);

// delete routes
// delete a post
router.delete("/delete/:postId", protectRoute, deletePostV2);
// delete a comment on post
router.delete("/delete-comment/:commentId", protectRoute, deleteCommentV2);
//


// Public Routes
// view public feed
router.get("/feed/:userId?", getFeedPostsV2);
// view comments on posts (Public)
router.get("/comments/:postId", getPostCommentsV2);
// get shareable url
router.get("/get-shareurl/:postId", getShareUrlV2);
// get post from shareable url
router.get("/get-fromurl/:shareId", getPostFromShareUrlV2);


export default router;
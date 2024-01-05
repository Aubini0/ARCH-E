import express from "express";
import {
    deletePostV2,
    createPostV2,
    replyToPostV2,
    getFeedPostsV2,    
    likeUnlikePostV2,
    getPostCommentsV2,
    getFollowedFeedPostsV2
} from "../../controllers/v2/postControllerV2.js";
import protectRoute from "../../middlewares/protectRoute.js";


const router = express.Router();

// Private Routes
router.post("/create", protectRoute, createPostV2);
router.put("/like/:id", protectRoute, likeUnlikePostV2);
router.post("/comment", protectRoute, replyToPostV2);
router.get("/followed-feed", protectRoute , getFollowedFeedPostsV2);
router.delete("/delete/:id", protectRoute, deletePostV2);



// Public Routes
router.get("/feed/:id?", getFeedPostsV2);
router.get("/comments/:id", getPostCommentsV2);


export default router;
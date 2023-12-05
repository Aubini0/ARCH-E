import express from "express";
import {
    createPost,
    deletePost,
    getPost,
    likeUnlikePost,
    replyToPost,
    getFeedPosts,
    getUserPosts,
    deleteComment,
    getAllPosts,
    fetchMatchingUsers
} from "../controllers/postController.js";
import protectRoute from "../middlewares/protectRoute.js";


const router = express.Router();

router.get("/feed/:id?", getFeedPosts);
router.get("/", getAllPosts);
router.get("/:id", getPost);
router.get("/user/:username", getUserPosts);
router.post("/create", protectRoute, createPost);
router.delete("/:id", protectRoute, deletePost);
router.put("/like/:id", protectRoute, likeUnlikePost);
router.put("/matching_users/", protectRoute, fetchMatchingUsers);
router.put("/reply/:id", protectRoute, replyToPost);
router.delete("/reply/delete/:id/:replyId", protectRoute, deleteComment);

export default router;
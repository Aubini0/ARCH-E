import express from "express";
import {
	createPost,
	deletePost,
	getPost,
	likeUnlikePost,
	replyToPost,
	getFeedPosts,
	getUserPosts,
	deleteComment
} from "../controllers/postController.js";
import protectRoute from "../middlewares/protectRoute.js";
import { upload } from "../utils/upload.js";

const router = express.Router();

router.get("/feed", protectRoute, getFeedPosts);

router.get("/:id", getPost);
router.get("/user/:username", getUserPosts);
router.post("/create",  protectRoute, upload.single('audioFile'), createPost);
router.delete("/:id", protectRoute, deletePost);
router.put("/like/:id", protectRoute, likeUnlikePost);
router.put("/reply/:id", protectRoute, replyToPost);
router.delete("/reply/delete/:id/:replyId", protectRoute, deleteComment);

export default router;

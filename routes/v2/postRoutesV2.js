import express from "express";
import {
    createPostV2,
    getFeedPostsV2
} from "../../controllers/v2/postControllerV2.js";
import protectRoute from "../../middlewares/protectRoute.js";


const router = express.Router();

router.post("/create", protectRoute, createPostV2);
router.get("/feed/:id?", getFeedPostsV2);



export default router;
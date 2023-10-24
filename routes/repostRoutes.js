import express from "express";
import {
	getUserReposts,
	createRepost,
} from "../controllers/repostController.js";
import protectRoute from "../middlewares/protectRoute.js";

const router = express.Router();

router.post("/create", protectRoute, createRepost);
router.get("/user/:username", protectRoute, getUserReposts);


export default router;

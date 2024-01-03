import express from "express";
import protectRoute from "../../middlewares/protectRoute.js";
import { followUnFollowUserV2 } from "../../controllers/v2/userControllerV2.js";

const router = express.Router();



router.put("/follows/:id", protectRoute, followUnFollowUserV2); 





export default router;
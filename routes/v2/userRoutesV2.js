import express from "express";
import protectRoute from "../../middlewares/protectRoute.js";
import { 
  followUnFollowUserV2 , 
  updateUserV2,
} from "../../controllers/v2/userControllerV2.js";

  

const router = express.Router();

// follow / un follow a user
router.put("/follows/:targetUserId", protectRoute, followUnFollowUserV2); 
// update User profile
router.put("/update", protectRoute, updateUserV2);


export default router;
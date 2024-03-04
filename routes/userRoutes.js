import express from "express";
import {
    followUnFollowUser,
    getUserProfile,
    loginUser,
    logoutUser,
    signupUser,
    updateUser,
    getSuggestedUsers,
    freezeAccount,
    getUserFriends,
    VerifyTOTP,
} from "../controllers/userController.js";
import protectRoute from "../middlewares/protectRoute.js";

const router = express.Router();



router.get("/profile/:query", getUserProfile);
router.get("/suggested/:id", protectRoute, getSuggestedUsers);
router.post("/signup", signupUser);
// commenting this route to prevent twillio auth error for now
// router.post("/createTOTP", CreateTOTP);
router.post("/verifyTOTP", VerifyTOTP);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/follow/:userId/:id", protectRoute, followUnFollowUser); // Toggle state(follow/unfollow)
router.put("/update/:id", protectRoute, updateUser);
router.put("/freeze", protectRoute, freezeAccount);
router.get("/friends", protectRoute, getUserFriends);



export default router;
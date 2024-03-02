import express from "express";
import protectRoute from "../../middlewares/protectRoute.js";
import { fetchPlayListsV2 } from "../../controllers/v2/broadcastController.js";
  

const router = express.Router();
// Verify Access token and return User Info
router.get("/fetch-playlists" , protectRoute , fetchPlayListsV2)

export default router;
import express from "express";
import protectRoute from "../../middlewares/protectRoute.js";
import { 
    joinBroadcastV2,
    startBroadcastV2,
    fetchSavedTracksV2,
    playSongInBroadcastV2,
    fetchSavedPlaylistsV2,      
} from "../../controllers/v2/broadcastController.js";
  

const router = express.Router();


// Returns User's playlists songs in Spotify
router.get("/fetch/saved-tracks" , protectRoute , fetchSavedTracksV2);
// Returns User's Saved songs in Spotify
router.get("/fetch/saved-playlists" , protectRoute , fetchSavedPlaylistsV2);



// Starting and host a broadcast
router.post("/start" , protectRoute , startBroadcastV2);
// Join a broadcast
router.post("/join" , protectRoute , joinBroadcastV2);


// Play a song In broadcast
router.post("/play-song" , protectRoute , playSongInBroadcastV2);


export default router;
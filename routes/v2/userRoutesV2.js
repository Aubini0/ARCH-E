import express from "express";
import protectRoute from "../../middlewares/protectRoute.js";
import { 
  followUnFollowUserV2 , 
  signupSuperAdminV2,
  googleAuthV2  , 
  googleCallBackV2
} from "../../controllers/v2/userControllerV2.js";

  

const router = express.Router();



router.put("/follows/:id", protectRoute, followUnFollowUserV2); 


// Initiates the Google Login flow
router.get('/auth/google', googleAuthV2);


// Callback URL for handling the Google Login response
router.get('/auth/google/callback', googleCallBackV2);


//SignUp a superAdmin
router.post('/superadmin/signup', signupSuperAdminV2);


export default router;
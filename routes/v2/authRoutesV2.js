import express from "express";
import protectRoute from "../../middlewares/protectRoute.js";
import { 
    signupUserV2,
    loginUserV2,
    verifyAccessV2,
    googleAuthV2,
    googleCallBackV2,
    signupSuperAdminV2
} from "../../controllers/v2/authController.js";

  

const router = express.Router();


// SignUp new account
router.post("/signup", signupUserV2);
// SignIn account
router.post("/login", loginUserV2);
// Verify Access token and return User Info
router.get("/verify-access" , protectRoute , verifyAccessV2)
// Initiates the Google Login flow
router.get('/google', googleAuthV2);
// Callback URL for handling the Google Login response
router.get('/google/callback', googleCallBackV2);
// Creating SuperAdmin
router.post('/superadmin/signup', signupSuperAdminV2);



export default router;
import express from "express";
import protectRoute from "../../middlewares/protectRoute.js";
import { followUnFollowUserV2 } from "../../controllers/v2/userControllerV2.js";
import axios from "axios";
import { google } from "googleapis";



const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
// const REDIRECT_URL = 'http://localhost:3000/api/v2/users/auth/google/callback';

const REDIRECT_URL = 'https://api.babblchat.com/api/v2/users/auth/google/callback';


const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URL
  );
  
const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
];
  

const router = express.Router();


router.put("/follows/:id", protectRoute, followUnFollowUserV2); 


// Initiates the Google Login flow
router.get('/auth/google', (req, res) => {

    // const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=profile email`;
    const url = oauth2Client.generateAuthUrl({
        // 'online' (default) or 'offline' (gets refresh_token)
        access_type: 'offline',
        /** Pass in the scopes array defined above.
         * Alternatively, if only one scope is needed, you can pass a scope URL as a string */
        scope: scopes,
        // Enable incremental authorization. Recommended as a best practice.
        include_granted_scopes: true
    });    

    res.redirect(url);
});


// Callback URL for handling the Google Login response
router.get('/auth/google/callback', async (req, res) => {
    const { code } = req.query;
  
    try {
      // Exchange authorization code for access token
    //   const { data } = await axios.post('https://oauth2.googleapis.com/token', {
    //     client_id: CLIENT_ID,
    //     client_secret: CLIENT_SECRET,
    //     code,
    //     redirect_uri: REDIRECT_URI,
    //     grant_type: 'authorization_code',
    //     access_type: 'offline',
    //     prompt: 'consent',
    //   });
  
    //   const { access_token, id_token } = data;
    //   console.log({ data })

    // Get access and refresh tokens (if access_type is offline)
    let { tokens } = await oauth2Client.getToken(code);
    console.log({tokens})
    oauth2Client.setCredentials(tokens);


  
      // Use access_token or id_token to fetch user profile
    //   const { data: profile } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
    //     headers: { Authorization: `Bearer ${access_token}` },
    //   });
      
    //   console.log({profile})
      // Code to handle user authentication and retrieval using the profile data
  
      res.redirect('/');
    } catch (error) {
      console.error('Error:', error);
    //   res.redirect('/login');
        res.json({ status : false })
    }
  });



export default router;
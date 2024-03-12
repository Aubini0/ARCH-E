import User from "../../models/userModel.js";
import generateTokenAndSetCookie from "../../utils/helpers/generateTokenAndSetCookie.js";
import {
    hashPassword,
    validatePassword
} from "../../utils/helpers/passwordSettersAndValidators.js";

import { uploadFileToS3 } from "../../utils/helpers/fileHandlers.js"

import { google } from "googleapis";

import { 
    formatUserData, 
    parsingBufferImage , 
    getRequest , 
    postRequest,
    calculateAge ,
    prepareRedirectUrl,
    generateRandomString
} from "../../utils/helpers/commonFuncs.js"

import { 
    updateRecord ,
    createRecord ,
} from "../../utils/helpers/commonDbQueries.js";
import { tokenizePayload , deTokenizePayload } from "../../utils/helpers/passwordSettersAndValidators.js";


import querystring from "querystring";
import qs from "qs";


const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URL = `${process.env.REDIRECT_BASE_URL}/api/v2/auth/google/callback`;
const SPOTIFY_REDIRECT_URL = `${process.env.REDIRECT_BASE_URL}/api/v2/auth/spotify/callback`;


const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URL
);
  


const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/user.birthday.read'
];

// Enter scopes in human readable format
const spotify_scopes_list = [
    
    "user-read-private",
    "user-read-email",
    
    "streaming",
    "app-remote-control",

    "playlist-read-private",
    "playlist-read-collaborative",
    "playlist-modify-private",
    "playlist-modify-public",
    "user-library-read",
    "user-library-modify",
    "user-modify-playback-state"

]




// Convert into spotify readable format
const spotify_scopes = spotify_scopes_list.join(" ")





const signUpServiceV2 = async (
    full_name,
    email, password,
    age, phone,
    profilePic, lat,
    long, ip , isSuperAdmin
) => {
    let profPicLocation;
    let access_roles = [ "user" ]
    const user = await User.findOne({ email });



    // check if user exists or not
    if (user) {
        throw {
            success: false,
            status: 400,
            message: "User already exists",
        };

    }

    // make email
    // let username = makeid(9)
    let username = email;

    password = hashPassword(password)

    // upload profile picture if provided
    if (profilePic) {

        let { fileName, type, buf } = parsingBufferImage(profilePic)

        profPicLocation = await uploadFileToS3(
            `${fileName.substr(fileName.length - 15)}.${type}`,
            buf, 'base64', `image/${type}`,
            process.env.S3BUCKET_PROFILEIMAGES, 'public-read'
        )

    }


    if(isSuperAdmin){
        access_roles.push("superAdmin")
    }

    // add user to DB
    const newUser = new User({
        full_name: full_name,
        username: username, age: age, phone: phone,
        profilePic: profPicLocation, password: password,
        email: email, ip: ip, lat: lat, long: long,
        isSuperAdmin ,  access_roles 
    });


    await newUser.save();
    if (newUser) {
        const token = await generateTokenAndSetCookie(newUser);

        formatUserData(newUser._doc)

        return {
            success: true,
            data: { ...newUser._doc },
            token,
            message: "Signed Up In Successfully"
        }


    }
    else {
        throw {
            success: false,
            status: 400,
            message: "Invalid user data",
        };
    }
};

const signInServiceV2 = async (
    email, password,
) => {


    const user = await User.findOne({ email });

    // check if user exists or not
    if (!user) {
        throw {
            success: false,
            status: 404,
            message: "Email Not Found",
        };
    }

    if(user.google_access_token){
        const token = await generateTokenAndSetCookie(user);

        formatUserData(user._doc)

        return {
            success: true,
            data: { ...user._doc },
            token,
            message: "Logged In Successfully"
        }
    }

    if (validatePassword(user, password)) {
        const token = await generateTokenAndSetCookie(user);

        formatUserData(user._doc)

        return {
            success: true,
            data: { ...user._doc },
            token,
            message: "Logged In Successfully"
        }


    }
    else {
        throw {
            success: false,
            status: 400,
            message: "Password Incorrect",
        };
    }

};

const verifyAccessServiceV2 = async (
    req,
) => {
    let userInfo = req.user._doc;
    let userToken = req.user.token;


    if (userInfo && userToken) {
        formatUserData(userInfo)


        return {
            success: true,
            data: { ...userInfo },
            token: userToken,
            message: "Logged In Successfully",
        };

    }

    throw {
        success: false,
        status: 404,
        message: "Record Not found",
    };



}

const gogogleAuthServiceV2 = async( )=>{
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        include_granted_scopes: true
    });   

    
    return {
        success : true,
        message : "Auth Url Generated",
        data : { url }
    }    
}

const googleCallBackServiceV2 = async(code , ip)=>{     
        let url;
        let userAge;
        let { tokens } = await oauth2Client.getToken(code);
        const { access_token , refresh_token } = tokens;

        let profileUrl = "https://www.googleapis.com/oauth2/v1/userinfo";
        let ageUrl = `https://people.googleapis.com/v1/people/me?personFields=birthdays&key=${process.env.GOOGLE_API_KEY}`;
        let headers = { Authorization: `Bearer ${access_token}` };

        const profile = await getRequest( profileUrl , headers );
        const ageData = await getRequest( ageUrl , headers );
        const birthdays = ageData.birthdays;

        // console.log(birthdays)
        if(birthdays){
            let index;
            if( birthdays.length > 1 ){ index = 1 }
            else{ index = 0 };

            let year = birthdays[ index ].date.year;
            let month = birthdays[ index ].date.month;
            let day = birthdays[ index ].date.day;
            userAge = calculateAge(day , month , year);
        }

        try{

            let userPayload = {
                full_name: profile.name, username: profile.email , age: userAge,
                profilePic: profile.picture,email: profile.email, ip: ip, 
                google_access_token : access_token, google_refresh_token : refresh_token,
            }

            const newUser = await createRecord( User , userPayload)

            if (newUser) {
                const token = await generateTokenAndSetCookie(newUser);
    
                url = prepareRedirectUrl( 200 , token )
                // console.log({ url })
                return url;            
            }
            else {
                url = prepareRedirectUrl( 400 )
                // console.log({ url })
                return url;
            }    
        }
        catch(err){
            if(err.code === 11000){
                const user = await User.findOne({ email : profile.email });    

                // If user already exist update its google_access_token
                let updateData = {
                    google_access_token : access_token
                }
                let updateUser = await updateRecord( User , user._id , updateData )

                // ---------------------------------------------------- //
                
                const token = await generateTokenAndSetCookie(user);

                url = prepareRedirectUrl( 200 , token )
                // console.log({ url })
                return url;                            
            }
            else{
                url = prepareRedirectUrl( 400 )
                // console.log({ url })
                return url;
            }
        }
          
}

const spotifyAuthServiceV2 = async( )=>{
    var state = generateRandomString(16);
    var scope = spotify_scopes;
    var client_id = process.env.SPOTIFY_CLIENT_ID;
    var redirect_uri = SPOTIFY_REDIRECT_URL;
    

  
    const url = 'https://accounts.spotify.com/authorize?' +
        querystring.stringify({
        response_type: 'code',
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state
    });

    return {
        success : true,
        message : "SpotifyAuth Url Generated",
        data : { url }
    }    

}

const spotifyCallBackServiceV2 = async(code , state , ip)=>{    
    let url; 
    let baseUrl;
    let auth_type = 2;
    let client_id = process.env.SPOTIFY_CLIENT_ID;
    let client_secret = process.env.SPOTIFY_CLIENT_SECRET;
    let redirect_uri = SPOTIFY_REDIRECT_URL;

    if (state === null) {
        baseUrl = process.env.BORADCAST_POPUP + querystring.stringify({ error : "state_mismatch" })
        url = prepareRedirectUrl( 403 , "" , auth_type  ,  baseUrl)
        return url;
    }

    let encoded = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
    let getTokenUrl = 'https://accounts.spotify.com/api/token'    
    let data = {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'

    }    
    let headers =  {
        'content-type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${encoded}`
    }

    let resp = await postRequest( getTokenUrl , qs.stringify(data) ,  headers )
    let {access_token , refresh_token} = resp;

    console.log({access_token , refresh_token})


    if (access_token && refresh_token){
        let encoded_token =  tokenizePayload({ access_token  , refresh_token });
        baseUrl = process.env.BORADCAST_POPUP
        url = prepareRedirectUrl( 200 , encoded_token , auth_type ,  baseUrl)
        // console.log({url})
        return url;    

    }
    else{
        baseUrl = process.env.BORADCAST_POPUP
        url = prepareRedirectUrl( 403 , "" , auth_type ,  baseUrl)
        return url;    
    }


}







const spotifyConnectToInternalServiceV2 = async (
    spotifyToken , userInfo
) => {

    const {access_token , refresh_token} = deTokenizePayload(spotifyToken);

    let update_body = {
        spotify_access_token : access_token,
        spotify_refresh_token : refresh_token    
    }

    // update user with its spotify access / refresh tokens
    await updateRecord(User , userInfo._id , update_body )

    return {
            success: true,
            data: { },
            message: "Spotify Connected Successfully"
    }

};





export {
    signUpServiceV2,
    signInServiceV2,
    verifyAccessServiceV2,
    gogogleAuthServiceV2,
    googleCallBackServiceV2,
    spotifyAuthServiceV2,
    spotifyCallBackServiceV2,
    spotifyConnectToInternalServiceV2

}
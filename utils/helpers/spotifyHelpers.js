import { 
    getRequest ,
    putRequest, 
    postRequest,
} from "./commonFuncs.js";
import qs from "qs";
import User from "../../models/userModel.js";
import { 
    updateRecord ,
} from "./commonDbQueries.js";


const requestHeaders = ( access_token , headers =  {} )=>{
    if(access_token){ headers["Authorization"] = `Bearer ${access_token}` }
    return { ...headers }
}



const refreshAndUpdateSpotifyToken = async( refreshToken , userId )=>{
    try{

        const url = "https://accounts.spotify.com/api/token";

        let headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        let data = {
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id : process.env.SPOTIFY_CLIENT_ID,
            client_secret : process.env.SPOTIFY_CLIENT_SECRET
        }



        const response = await postRequest( url , qs.stringify(data) , headers )
        const access_token = response.access_token;

        let update_body = {
            spotify_access_token : access_token
        }
    
        // update user with its spotify access / refresh tokens
        await updateRecord(User , userId , update_body )
    

        return { status : true , access_token };
    
    }
    catch(err){
        console.log({err})
        return { status : false  }
    }

}



const playSong = async( deviceId , access_token , track_uri )=>{
    let playSongUrl = `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`;
    let extraHeaders = { 'Content-Type': 'application/x-www-form-urlencoded' }
    let headers = requestHeaders( access_token , extraHeaders );
 
    let data = {
        "uris": [ track_uri ],
        "offset": {
            "position": 5
        },
        "position_ms": 0
    }


    const response = await putRequest( playSongUrl , qs.stringify(data) , headers )
    console.log({response})


}

export {
    playSong,
    requestHeaders,
    refreshAndUpdateSpotifyToken
}
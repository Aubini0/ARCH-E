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



const refreshAndUpdateSpotifyToken = async( refreshToken , userId , extra_update_params )=>{
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
            spotify_access_token : access_token,
            ...extra_update_params
        }
    
        // update user with its spotify access / refresh tokens
        let updatedInfo = await updateRecord(User , userId , update_body )
    

        return { status : true , access_token , updatedInfo };
    
    }
    catch(err){
        console.log({err})
        return { status : false  }
    }

}



const playSong = async( deviceId , access_token , track_uri , position_ms = 0 )=>{
    let playSongUrl = `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`;
    let extraHeaders = { 'Content-Type': 'application/json' }
    let headers = requestHeaders( access_token , extraHeaders );
 
    let data = {
        "uris" : [track_uri],
        "offset": {
            "position": 0
        },
        "position_ms": position_ms
    }



    try{
        const response = await putRequest( playSongUrl ,data , headers )
        console.log({response})    
    }
    catch(err){
        console.log({err})
        throw {
            success: false,
            status: 400,
            message: "DeviceId not found",
        }
    }

}


const pausePlayBack = async( device_id , access_token )=>{
    let togglePlayBackUrl = `https://api.spotify.com/v1/me/player/pause?device_id=${device_id}`;
    let headers = requestHeaders( access_token );

    console.log({ togglePlayBackUrl , headers })
    try{
        let responce = await putRequest( togglePlayBackUrl , {} , headers  )
        console.log({responce})    
    }
    catch(err){
        console.log({err})
    }
}



export {
    playSong,
    pausePlayBack,
    requestHeaders,
    refreshAndUpdateSpotifyToken
}
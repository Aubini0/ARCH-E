import User from "../../models/userModel.js";
import { 
    getRequest , 
    postRequest,
} from "../../utils/helpers/commonFuncs.js"
import {
    playSong,
    requestHeaders,
    refreshAndUpdateSpotifyToken
} from "../../utils/helpers/spotifyHelpers.js";
import { 
    findRecord,
    updateRecord ,
} from "../../utils/helpers/commonDbQueries.js";
import { nanoid } from 'nanoid'
import { 
    joinBroadcast ,
    publishBroadcast ,
} from "../../socketHandlers/emitters.js"



const fetchFromSpotifyLibraryServiceV2 = async (
    spotifyEndpoint , userInfo , limit , offset
) => {

    let items = [];
    let playListsUrl = `${spotifyEndpoint}?limit=${limit}&offset=${offset}`
    let headers = requestHeaders( userInfo.spotify_access_token );

    try{
        let responce = await getRequest( playListsUrl , headers );
        items = responce.items;

        return {
            success: true,
            data: { items },
            message: "Fetched Successfully",
        };    
    }
    catch(err){
        console.log({err})

        if (err.response.status == 401){

            let resp = await refreshAndUpdateSpotifyToken( userInfo.spotify_refresh_token , userInfo._id );
            if(resp.status){
                let accessToken = resp.access_token;
                
                let headers = requestHeaders( accessToken );
                let responce = await getRequest( playListsUrl , headers );
                items = responce.items;
        

                return {
                    success: true,
                    data: { items },
                    message: "Fetched Successfully",
                };    
        
            }
            else{
                throw {
                    success: false,
                    status: 401,
                    message: "User not authorized, Login Again to spotify",
                };        
            }


        }

        if(err.response.status == 403){
            throw {
                success: false,
                status: 403,
                message: "You are not authorized to use spotify API. Ask developer to add it to list of allowed users.",
            };    
        }
        throw {
            success: false,
            status: 400,
            message: "Items Not fetched",
        };

    }


}

const startBroadcastServiceV2 = async (
    name  , userInfo
) => {
    // Throw error in case user's spotify isnt connected
    if (!userInfo.spotify_access_token){
        throw {
            success: false,
            status: 400,
            message: "Conenct Spotify Account First",
        };
    }

    // TODO:
        // Make a high level API call to spotify using access_token to verify if 
        // user token is still valid, or has'nt removed access from his spotify
        // account manually. 


    // initalizing startboradcast payload for database
    let broadCastName = name;
    let broadCastStatus = true;
    let broadcastListeners = 1;
    let broadCastCurrentTrack = "";
    // make a unique agora_channel name for this broadcast
    let broadCastChannelName = `${userInfo._id}-${Date.now()}`;
    // make a concize shareable id for broadcast 
    let broadCastShareId = nanoid(11);


    let shareUrl = `${process.env.BORADCAST_POPUP}${broadCastShareId}`
    // update USER with broadcast channel_name against broadcasr_sharedId
    // update broadcast status and members joined to true & [] respectively
    let update_body = {
        broadCastName, broadCastStatus, broadCastShareId,
        broadcastListeners, broadCastChannelName, broadCastCurrentTrack,
    }


    // refresh spotify token before starting broadcast
    let resp = await refreshAndUpdateSpotifyToken( 
        userInfo.spotify_refresh_token,
        userInfo._id, update_body
    )

    if(!resp.status){
        throw {
            success: false,
            status: 401,
            message: "User not authorized, Login Again to spotify",
        };        
    }

    let updatedUserInfo = resp.updatedInfo
    let broadcastDetails = { 
        channel_name : broadCastChannelName ,  broadcast_name : broadCastName , 
        username : updatedUserInfo.full_name, spotify_access_token  : updatedUserInfo.spotify_access_token
    };

    return {
        success: true,
        data: {  shareUrl, broadcastDetails },
        message: "BroadCast Started Successfully",
    };    


}

const joinBroadcastServiceV2 = async (
    broadCastShareId , userInfo
) => {


    // Throw error in case user's spotify isnt connected
    if (!userInfo.spotify_access_token){
        throw {
            success: false,
            status: 400,
            message: "Conenct Spotify Account First",
        };
    }

    let query_obj = { broadCastShareId }
    let broadCastHost = await findRecord( User , query_obj , "Broadcast ID Invalid" );
    broadCastHost = broadCastHost[0];
    // refresh spotify token before joining broadcast
    let resp = await refreshAndUpdateSpotifyToken( 
        userInfo.spotify_refresh_token,
        userInfo._id
    )

    if(!resp.status){
        throw {
            success: false,
            status: 401,
            message: "User not authorized, Login Again to spotify",
        };        
    }

    let updatedUserInfo = resp.updatedInfo


    let broadcastDetails = {  
        channel_name : broadCastHost.broadCastChannelName , broadcast_name :broadCastHost.broadCastName , 
        host_name : broadCastHost.full_name ,  username : updatedUserInfo.full_name , 
        spotify_access_token : updatedUserInfo.spotify_access_token, hostId : broadCastHost._id,
        hostProfilePic : broadCastHost.profilePic , listeners : broadCastHost.broadcastListeners
    };

    return {
        success: true,
        data: { broadcastDetails },
        message: "BroadCast Joined Successfully",
    };    


}

const playSongInBroadcastServiceV2 = async (
    uri , deviceId , userInfo
) => {
    // Throw error in case user's spotify isnt connected
    if (!userInfo.spotify_access_token){
        throw {
            success: false,
            status: 400,
            message: "Conenct Spotify Account First",
        };
    }

    let activeListeners = userInfo.broadcastListeners;
    
    // update user with current track uri being streamed
    let update_body = { broadCastCurrentTrack : uri } 
    await updateRecord(User , userInfo._id , update_body);

    // playSong on requested User end
    await playSong( deviceId ,  userInfo.spotify_access_token , uri );

    // // play song at host end
    // await playSong( userInfo.spotifyDeviceId , userInfo.spotify_access_token , uri )
    // // play song to all broadcast listeners 
    // await Promise.all( activeListeners.map(async(item)=>{
    //     // console.log({ item })
    //     await playSong( item.device_id , item.spotify_access_token , uri )
    // }))


    return {
        success: true,
        data: { listenres : userInfo.broadcastListeners },
        message: "Song Streamed Successfully",
    };    


}



const searchFromSpotifyServiceV2 = async (
    userInfo , searchBaseUrl , query , limit , offset
) => {

    let items;
    let searchUrl = `${searchBaseUrl}?q=${query}&type=track&limit=${limit}&offset=${offset}`
    let headers = requestHeaders( userInfo.spotify_access_token );

    try{
        let responce = await getRequest( searchUrl , headers );
        items = responce.tracks.items;
        return {
            success: true,
            data: { items },
            message: "Fetched Successfully",
        };    
    }
    catch(err){
        console.log({err})

        if (err.response.status == 401){

            let resp = await refreshAndUpdateSpotifyToken( userInfo.spotify_refresh_token , userInfo._id );
            if(resp.status){
                let accessToken = resp.access_token;
                let headers = requestHeaders( accessToken );
                let responce = await getRequest( searchUrl , headers );
                items = responce.tracks.items;
                return {
                    success: true,
                    data: { items },
                    message: "Fetched Successfully",
                };    
            }
            else{
                throw {
                    success: false,
                    status: 401,
                    message: "User not authorized, Login Again to spotify",
                };        
            }
        }

        if(err.response.status == 403){
            throw {
                success: false,
                status: 403,
                message: "You are not authorized to use spotify API. Ask developer to add it to list of allowed users.",
            };    
        }
        throw {
            success: false,
            status: 400,
            message: "Items Not fetched",
        };

    }


}



export {
    joinBroadcastServiceV2,
    startBroadcastServiceV2,
    searchFromSpotifyServiceV2,
    playSongInBroadcastServiceV2,
    fetchFromSpotifyLibraryServiceV2,
}


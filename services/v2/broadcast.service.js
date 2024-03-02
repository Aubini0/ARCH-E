import User from "../../models/userModel.js";
import { 
    getRequest , 
    postRequest,
} from "../../utils/helpers/commonFuncs.js"
import {
    requestHeaders,
    refreshAndUpdateSpotifyToken
} from "../../utils/helpers/spotifyHelpers.js";


const fetchUserPlayListsServiceV2 = async (
    userInfo , limit , offset
) => {

    let playLists = [];
    let savedTracksBaseUrl = "https://api.spotify.com/v1/me/tracks";
    let playListsBaseUrl = "https://api.spotify.com/v1/me/playlists";
    let playListsUrl = `${savedTracksBaseUrl}?limit=${limit}&offset=${offset}`
    let headers = requestHeaders( userInfo.spotify_access_token );

    try{
        let responce = await getRequest( playListsUrl , headers );
        playLists = responce.items;

        return {
            success: true,
            data: { playLists },
            message: "User PlayLists Fetched Successfully",
        };    
    }
    catch(err){
        // console.log({err})

        if (err.response.status == 401){

            let resp = await refreshAndUpdateSpotifyToken( userInfo.spotify_refresh_token , userInfo._id );
            if(resp.status){
                let accessToken = resp.access_token;
                
                let headers = requestHeaders( accessToken );
                let responce = await getRequest( playListsUrl , headers );
                playLists = responce.items;
        

                return {
                    success: true,
                    data: { playLists },
                    message: "User PlayLists Fetched Successfully",
                };    
        
            }
            else{
                throw {
                    success: false,
                    status: 401,
                    message: "User not authorized to fetch playlists, Login Again to spotify",
                };        
            }


        }
        throw {
            success: false,
            status: 400,
            message: "PlayLists Not fetched",
        };

    }


}


export {
    fetchUserPlayListsServiceV2,
}


import User from "../models/userModel.js"
import { findRecordById , updateRecord } from "../utils/helpers/commonDbQueries.js";
import { 
    playSong ,
    pausePlayBack , 
} from "../utils/helpers/spotifyHelpers.js"

const addBroadcastListner = async( data )=>{    
    let payload = data.payload;
    let { device_id , spotify_access_token , userId , hostId } = payload;
    console.log({payload})
    if (userId || hostId){
        let uniqueUserId = hostId ? hostId : userId
        let updateBody = hostId ?  
                    { $push: { broadcastListeners: { device_id , spotify_access_token } } }  
                        :
                    { spotifyDeviceId : device_id }    
        let userUpdateResp = await updateRecord( User , uniqueUserId , updateBody );
    }
}



const addPausePlayBackListner = async( data )=>{    
    let payload = data.payload;
    let { userId } = payload;
    console.log({payload})

    if(userId){
        try{
            let hostUser = await findRecordById( User , userId , "User not found");
            let broadcastListeners = hostUser.broadcastListeners;

            await Promise.all( broadcastListeners.map(async(item)=>{
                console.log({ item })
                await pausePlayBack( item.device_id , item.spotify_access_token  )
            }))
        


        }
        catch(err){
            // do nothing in case user not found
        }
    }

}



const addResumePlayBackListner = async( data )=>{    
    let payload = data.payload;
    let { userId , track_uri , currentPosition } = payload;
    console.log({payload})

    if(userId && currentPosition ){
        try{
            let hostUser = await findRecordById( User , userId , "User not found");
            let broadcastListeners = hostUser.broadcastListeners;

            await Promise.all( broadcastListeners.map(async(item)=>{
                console.log({ item })
                await playSong( item.device_id , item.spotify_access_token , track_uri , currentPosition  )
            }))

        }
        catch(err){
            // do nothing in case user not found
        }
    }

}


export { 
    addBroadcastListner,
    addPausePlayBackListner,
    addResumePlayBackListner,
};

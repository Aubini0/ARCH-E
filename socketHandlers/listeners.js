import User from "../models/userModel.js"
import { 
    findRecord , 
    findRecordById , 
    updateRecord 
} from "../utils/helpers/commonDbQueries.js";
import { 
    playSong ,
    pausePlayBack , 
} from "../utils/helpers/spotifyHelpers.js"

const addJoinRoomListner = async( socket , io , data )=>{
    let payload = data.payload;
    let socketRoom = payload?.socketRoom;
    if (socketRoom){
        socket.join( socketRoom );
        const clients = io.sockets.adapter.rooms.get( socketRoom )
        if(clients){
            let socketData = { payload : {  users : clients.size  }};
            io.to(socketRoom).emit("onlineListeners" , socketData)
        }

    }
}

const addPLaySongListner = async( socket , data )=>{
    let payload = data.payload;
    let socketRoom = payload?.socketRoom;
    if (socketRoom){
        let socketData = { payload : {  ...payload  }};
        socket.to(socketRoom).emit("playSong" , socketData)
    }
}


const addPauseSongListner = async( socket , data )=>{
    let payload = data.payload;
    let socketRoom = payload?.socketRoom;
    if (socketRoom){
        let socketData = { payload : {  ...payload  }};
        socket.to(socketRoom).emit("pauseSong" , socketData)
    }
}


const addResumeSongListner = async( socket , data )=>{
    let payload = data.payload;
    let socketRoom = payload?.socketRoom;
    if (socketRoom){
        let socketData = { payload : {  ...payload   }};
        socket.to(socketRoom).emit("resumeSong" , socketData)
    }
}


const addLeaveRoomListner = async( socket , data )=>{
    let payload = data.payload;
    let socketRoom = payload?.socketRoom;
    console.log({socketRoom})
    if (socketRoom){
        socket.leave(socketRoom);
    }
}



const addEndRoomListner = async( socket , data )=>{
    let payload = data.payload;
    let  userData  = payload?.userData;
    let socketRoom = payload?.socketRoom;
    if (socketRoom && userData){
        // clear broadcast related data
        let update_body = {
            broadCastName : "",
            broadCastStatus : false,
            broadCastShareId : "",
            broadcastListeners : [],
            broadCastChannelName : "",
            broadCastCurrentTrack : "",
            spotifyDeviceId : "",
        }
        await updateRecord(User , userData._id , update_body);

        // notify to all clients that broadcast has ended
        let socketData = { payload : {  ...payload  }};
        socket.to(socketRoom).emit("broadcastEnded" , socketData)
        // leave room
        socket.leave(socketRoom);
    }
}





const addBroadcastListner = async( data )=>{    
    let payload = data.payload;
    let { device_id , spotify_access_token , userId , hostId } = payload;
    if (userId || hostId){
        let uniqueUserId = hostId ? hostId : userId
        let updateBody = hostId ?  
                    { $push: { broadcastListeners: { device_id , userId , spotify_access_token } } }  
                        :
                    { spotifyDeviceId : device_id }    
        let userUpdateResp = await updateRecord( User , uniqueUserId , updateBody );

        // in case of setup device as a listner play song that is 
        // currently being played in broadcast
        if(hostId && userUpdateResp.broadCastCurrentTrack){  
            await playSong( device_id ,  spotify_access_token , userUpdateResp.broadCastCurrentTrack )
        }
        
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


const addBroadcastEndedListner = async( data )=>{    
    let payload = data.payload;
    let  userData  = payload;
    // console.log("BroadcastEnded > " , {userData})

    // clear broadcast related data
    let update_body = {
        broadCastName : "",
        broadCastStatus : false,
        broadCastShareId : "",
        broadcastListeners : [],
        broadCastChannelName : "",
        broadCastCurrentTrack : "",
        spotifyDeviceId : "",
    }

    await updateRecord(User , userData._id , update_body);

}


const addLeaveBroadcastListner = async( data )=>{    
    let payload = data.payload;
    let  userData  = payload;
    let broadCastShareId = userData.shareId;
    // console.log("LeftBroadcast > " , {userData})

    let query_obj = { broadCastShareId }

    try{
        let broadCastHost = await findRecord( User , query_obj , "Broadcast ID Invalid" );
        broadCastHost = broadCastHost[0];

        // remove the user which has left from broadcast listeners
        let update_body = { 
            $pull: { broadcastListeners : { userId : userData._id } } 
        }
        await updateRecord( User , broadCastHost._id , update_body );

    }
    catch(err){
        // ... do nothing ....
    }



}


export { 
    // New Listneres
    addEndRoomListner,
    addJoinRoomListner,
    addPLaySongListner,
    addPauseSongListner,
    addLeaveRoomListner,
    addResumeSongListner,


    // Old Listneres (remove after new architecrure)
    addBroadcastListner,
    addPausePlayBackListner,
    addResumePlayBackListner,
    addBroadcastEndedListner,
    addLeaveBroadcastListner,
};

import User from "../models/userModel.js"
import { 
    updateRecord 
} from "../utils/helpers/commonDbQueries.js";
import { updateListenerCount } from "../utils/helpers/commonFuncs.js";
import { checkAndPlaySong } from "../utils/helpers/spotifyHelpers.js";


const addJoinRoomListner = async( socket , io , data )=>{
    let payload = data.payload;
    let socketRoom = payload?.socketRoom;
    let hostId = payload?.hostId;
    let device_id = payload?.device_id;
    let spotify_access_token = payload?.spotify_access_token;
    if ( socketRoom ){
        socket.join( socketRoom );
        // update broadcast listner count
        await updateListenerCount( io , socketRoom , hostId )
        // in case of listner joins the broadcast play a song if its already
        // in playing state by host
        if(hostId  &&  device_id && spotify_access_token ){
            await checkAndPlaySong( hostId , device_id , spotify_access_token  )
        }
        
    }
}

const addPLaySongListner = async( socket , data )=>{
    let payload = data.payload;
    let socketRoom = payload?.socketRoom;
    let userData = payload?.userData;
    let broadCastCurrentTrack = payload?.trackUri;
    if (socketRoom){
        let socketData = { payload : {  ...payload  }};
        socket.to(socketRoom).emit("playSong" , socketData)

        if( broadCastCurrentTrack ){
            let update_body = { broadCastCurrentTrack }
            await updateRecord( User , userData._id , update_body);    
        }
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


const addLeaveRoomListner = async( socket , io , data )=>{
    let payload = data.payload;
    let socketRoom = payload?.socketRoom;
    let hostId = payload?.hostId;
    console.log({socketRoom})
    if (socketRoom ){
        socket.leave(socketRoom);
        // update broadcast listner count
        await updateListenerCount( io , socketRoom , hostId )
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
            broadcastListeners : 0,
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




export { 
    // New Listneres
    addEndRoomListner,
    addJoinRoomListner,
    addPLaySongListner,
    addPauseSongListner,
    addLeaveRoomListner,
    addResumeSongListner,
};

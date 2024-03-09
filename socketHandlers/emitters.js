// Import Socket.IO interface from socket.js file
import { io } from "../socket/socket.js";

const publishBroadcast = ( 
        userId , channel_name , broadcast_name , 
        username , spotify_access_token
    )=>{    

    let socketData = { payload : { 
        channel_name , broadcast_name , username,
        spotify_access_token   
    }};
    let socketEvent = `start-broadcast-${userId}`;
    io.emit( socketEvent , socketData );
}


const joinBroadcast = ( 
        userId , channel_name , broadcast_name , 
        host_name , username , spotify_access_token ,
        hostId
    )=>{    

    let socketData = { payload : {  
        channel_name , broadcast_name , host_name , 
        username , spotify_access_token , hostId
    }};
    
    let socketEvent = `join-broadcast-${userId}`;
    io.emit( socketEvent , socketData );
}


export { 
    joinBroadcast,
    publishBroadcast
};

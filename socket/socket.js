import { Server } from "socket.io";
import http from "http";
import express from "express";

import { 
    addEndRoomListner,
    addJoinRoomListner,
    addPLaySongListner,
    addPauseSongListner,
    addLeaveRoomListner,
    addResumeSongListner,
} from "../socketHandlers/listeners.js"

const PORT = process.env.PORT || 5000;


// Initializing Express.JS server
const app = express();
// Initalizing HTTP server to handle Socket.io + express.js app
const server = http.createServer(app);


const io = new Server(server, {
    cors: {
        // origin: `http://localhost:${PORT}`,
        origin : "*",
        methods: ["GET", "POST"],
    },
});


export const getRecipientSocketId = (recipientId) => {
    return userSocketMap[recipientId];
};

const userSocketMap = {}; // userId: socketId



io.on("connection", (socket) => {
    console.log("ConnectedUser ::> ", socket.id);
    const userId = socket.handshake.query.userId;

    // listner for checking if some user has joined the room
    socket.on("joinRoom" , async( data )=>{
        console.log("Inside JoinRooom" , {data})
        addJoinRoomListner( socket , io ,  data )
    })

    socket.on("playSong" , async(data)=>{
        console.log("Inside PlaySong : " , {data})
        addPLaySongListner( socket ,  data );
    })

    socket.on("pauseSong" , async(data)=>{
        console.log("Inside PauseSongs : " , {data})
        addPauseSongListner( socket , data );
    })

    socket.on("resumeSong" ,  async(data)=>{
        console.log("Inside ResumeSongs : " , {data})
        addResumeSongListner( socket , data )
    })

    socket.on("leftRoom" , (data)=>{
        console.log("Inside LeftRooom" , {data})
        addLeaveRoomListner( socket , io , data )
    })

    socket.on("endRoom" , (data)=>{
        console.log("Inside EndRooom" , {data})
        addEndRoomListner( socket , data )
    })


    socket.on("disconnect", () => {
        console.log("user disconnected");
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });

    
    
});

export { io, server, app , PORT };
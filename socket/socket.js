import { Server } from "socket.io";
import http from "http";
import express from "express";
import Message from "../models/messageModel.js";
import Conversation from "../models/conversationModel.js";
import { 
    joinQueue, 
    getOnlineUsers, 
    leaveQueue 
} from "../socketHandlers/callSocketsHandler.js";

import { 
    addEndRoomListner,
    addJoinRoomListner,
    addPLaySongListner,
    addPauseSongListner,
    addLeaveRoomListner,
    addResumeSongListner,

    addBroadcastListner , 
    addPausePlayBackListner ,
    addResumePlayBackListner ,
    addBroadcastEndedListner ,
    addLeaveBroadcastListner
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
let onlineUsers = {}; // online users queue



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
        addLeaveRoomListner( socket , data )
    })

    socket.on("endRoom" , (data)=>{
        console.log("Inside EndRooom" , {data})
        addEndRoomListner( socket , data )
    })





    // listener for checking if spotify device had been setup at user device.
    // socket.on("deviceSetup" , async(data)=>{
    //     addBroadcastListner( data );
    // })

    // listener for checking pause audio track event from host
    // socket.on("pause-song" , async(data)=>{
    //     addPausePlayBackListner( data );
    // })

    // // listener for checking resume audio track event from host
    // socket.on("resume-song" , async(data)=>{
    //     addResumePlayBackListner( data );
    // })

    // // listener for checking is user has left broadcast
    // socket.on("left-broadcast" , async(data)=>{
    //     addLeaveBroadcastListner( data )
    // })

    // // listener for checking broadcast ended event from host
    // socket.on("broadcast-ended" ,async(data)=>{
    //     addBroadcastEndedListner( data );
    // })




    socket.on("disconnect", () => {
        console.log("user disconnected");
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });




    // if (userId != "undefined") userSocketMap[userId] = socket.id;
    // io.emit("getOnlineUsers", Object.keys(userSocketMap));


    // online user event
    // socket.on("joinQueue" , async( data )=>{
    //     joinQueue( socket , data , onlineUsers )
    // })

    // socket.on("getOnlineUsers" , async()=>{
    //     getOnlineUsers( onlineUsers )
    // })

    // socket.on("leaveQueue" , async( data )=>{
    //     leaveQueue(data , onlineUsers)
    // })


    // socket.on("markMessagesAsSeen", async({ conversationId, userId }) => {
    //     try {
    //         await Message.updateMany({ conversationId: conversationId, seen: false }, { $set: { seen: true } });
    //         await Conversation.updateOne({ _id: conversationId }, { $set: { "lastMessage.seen": true } });
    //         io.to(userSocketMap[userId]).emit("messagesSeen", { conversationId });
    //     } catch (error) {
    //         console.log(error);
    //     }
    // });

    // socket.on("followUnfollowEvent", async({ userId, followed }) => {
    //     io.to(userSocketMap[userId]).emit("followUnfollowEvent", { userId, followed });
    // });

    // socket.on("likeUnlikeEvent", async({ userId, liked }) => {
    //     io.to(userSocketMap[userId]).emit("followUnfollowEvent", { userId, liked });
    // });

    // socket.on("repostEvent", async({ userId }) => {
    //     io.to(userSocketMap[userId]).emit("repostEvent", { userId });
    // });

    
    
});

export { io, server, app , PORT };
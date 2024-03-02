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

const PORT = process.env.PORT || 5000;


// Initializing Express.JS server
const app = express();
// Initalizing HTTP server to handle Socket.io + express.js app
const server = http.createServer(app);


const io = new Server(server, {
    cors: {
        origin: `http://localhost:${PORT}`,
        methods: ["GET", "POST"],
    },
});


export const getRecipientSocketId = (recipientId) => {
    return userSocketMap[recipientId];
};

const userSocketMap = {}; // userId: socketId
let onlineUsers = {}; // online users queue



io.on("connection", (socket) => {
    console.log("user connected", socket.id);
    const userId = socket.handshake.query.userId;

    if (userId != "undefined") userSocketMap[userId] = socket.id;
    io.emit("getOnlineUsers", Object.keys(userSocketMap));



    // online user event
    socket.on("joinQueue" , async( data )=>{
        joinQueue( socket , data , onlineUsers )
    })

    socket.on("getOnlineUsers" , async()=>{
        getOnlineUsers( onlineUsers )
    })

    socket.on("leaveQueue" , async( data )=>{
        leaveQueue(data , onlineUsers)
    })


    socket.on("markMessagesAsSeen", async({ conversationId, userId }) => {
        try {
            await Message.updateMany({ conversationId: conversationId, seen: false }, { $set: { seen: true } });
            await Conversation.updateOne({ _id: conversationId }, { $set: { "lastMessage.seen": true } });
            io.to(userSocketMap[userId]).emit("messagesSeen", { conversationId });
        } catch (error) {
            console.log(error);
        }
    });

    socket.on("followUnfollowEvent", async({ userId, followed }) => {
        io.to(userSocketMap[userId]).emit("followUnfollowEvent", { userId, followed });
    });

    socket.on("likeUnlikeEvent", async({ userId, liked }) => {
        io.to(userSocketMap[userId]).emit("followUnfollowEvent", { userId, liked });
    });

    socket.on("repostEvent", async({ userId }) => {
        io.to(userSocketMap[userId]).emit("repostEvent", { userId });
    });

    socket.on("disconnect", () => {
        console.log("user disconnected");
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
    
});

export { io, server, app , PORT };
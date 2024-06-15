import { Server } from "socket.io";
import http from "http";
import express from "express";

const PORT = process.env.PORT || 5000;

// Initializing Express.JS server
const app = express();
// Initalizing HTTP server to handle Socket.io + express.js app
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    // origin: `http://localhost:${PORT}`,
    origin: "*",
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
  socket.on("disconnect", () => {
    console.log("user disconnected");
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, server, app, PORT };

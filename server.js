import express from "express";
import dotenv from "dotenv";
import connectDB from "./db/connectDB.js";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import repostRoutes from "./routes/repostRoutes.js";
import { v2 as cloudinary } from "cloudinary";
import cors from "cors";
// import { app } from "./socket/socket.js";

dotenv.config();


const app = express();



app.use(cors());

app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.url;
    console.log(`RequestLogs :> ${timestamp} , ${method} , ${url}`);
    next();
});

const PORT = process.env.PORT || 5000;

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });


// Middlewares
app.use(express.json({ limit: "100mb" })); // To parse JSON data in the req.body
app.use(express.urlencoded({ extended: true })); // To parse form data in the req.body
app.use(cookieParser());
app.set('trust proxy', true)

// Routes
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/reposts", repostRoutes);


(async()=>{
    // wait for db to connect then proceed
    await connectDB();

    // start server to listen at specified port
    app.listen(PORT, () =>
        console.log(`Server started at http://localhost:${PORT}`)
    );

})();


import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import connectDB from "./db/connectDB.js";
import userRoutes from "./routes/userRoutes.js";

// -------------- V2 Routes -------------- //
import userRoutesV2 from "./routes/v2/userRoutesV2.js";
import authRoutesV2 from "./routes/v2/authRoutesV2.js";
import botRoutesV2 from "./routes/v2/botRoutesV2.js";
// -------------- V2 Routes -------------- //

// -------------- Socket Server -------------- //
// Use it incase you need socket handlers with express.js running
import { app, server, PORT } from "./socket/socket.js";
// -------------- Socket Server -------------- //

dotenv.config();

// Uncomment it to use normal express app without socket handlers
// const app = express();

// enable cors
app.use(cors());

// Middleware to log incomming requests
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(
    `Request >>> TimeStamp:- ${timestamp} , Endpoint:- ${req.url} , Method:- ${req.method}`
  );
  next();
});

// Middlewares
app.use(express.json({ limit: "100mb" })); // To parse JSON data in the req.body
app.use(express.urlencoded({ extended: true })); // To parse form data in the req.body
app.use(cookieParser());
app.set("trust proxy", true);

// health check endpoint of load balancer.
// returning by default 200 so our EBS always stay healthy
app.use("/health-check", async (req, res) => {
  // here is the route
  res.status(200).send({
    success: true,
    message: "health check endpoint",
  });
});

// Old Routes in Amplified Repository
app.use("/api/users", userRoutes);

// V2 API Routes
app.use("/api/v2/auth", authRoutesV2);
app.use("/api/v2/users", userRoutesV2);
app.use("/api/v2/bots", botRoutesV2);

(async () => {
  // wait for the db to connect and then proceed
  await connectDB();

  // start server to listen at specified port
  server.listen(PORT, () =>
    console.log(`Server started at http://localhost:${PORT}`)
  );
})();

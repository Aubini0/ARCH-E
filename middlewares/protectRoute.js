import User from "../models/userModel.js";
import jwt from "jsonwebtoken";



const protectRoute = async (req, res, next) => {
  const bearerToken = await req.body.token || req.query.token || req.headers["authorization"]

  console.log("bearerToken", bearerToken);

  if (!bearerToken) {
    return res.status(403).send("a token is required for authentication")
  }
  try {
    // const token = bearerToken.substring(7)
    // console.log("token", token)
    console.log("token", bearerToken);
    const decoded = jwt.verify(bearerToken, "Hycienth")
    console.log("decoded", decoded);
    req.user = decoded
  } catch (error) {
    return res.status(401).send("Invalid Token")
  }

  return next()
}


export default protectRoute
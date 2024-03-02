import User from "../models/userModel.js";
import jwt from "jsonwebtoken";



// validate JWT 
const protectRoute = async(req, res, next) => {
    const bearerToken = await req.body.token || req.query.token || req.headers["authorization"]


    if (!bearerToken) {
        return res.status(403).json({
            success:  false,
            error : "A token is required for authentication"
        })
    }
    try {
        const decoded = jwt.verify(bearerToken, process.env.JWT_TOKEN_SECRET)

        const user = await User.findOne({ 
            _id :  decoded.id , 
            password : decoded.password 
        });

        if(user){
            req.user = user
            req.user.token = bearerToken    
            next();
        }
        else{
            return res.status(401).json({
                success : false,
                error : "Invalid Token"
            })    
        }


    } catch (error) {
        return res.status(401).json({
            success : false,
            error : "Invalid Token"
        })
    }

}


export default protectRoute
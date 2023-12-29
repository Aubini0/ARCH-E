import User from "../models/userModel.js";
import jwt from "jsonwebtoken";



const protectRoute = async(req, res, next) => {
    const bearerToken = await req.body.token || req.query.token || req.headers["authorization"]


    if (!bearerToken) {
        res.status(403).json({
            success:  false,
            error : "A token is required for authentication"
        })
    }
    try {
        const decoded = jwt.verify(bearerToken, "amplify")

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
            res.status(401).json({
                success : false,
                error : "Invalid Token"
            })    
        }


    } catch (error) {
        res.status(401).json({
            success : false,
            error : "Invalid Token"
        })
    }

}


export default protectRoute
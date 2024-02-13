import jwt from "jsonwebtoken";

const generateTokenAndSetCookie = (userInfo, res) => {

    const token = jwt.sign({ 
        id : userInfo._id , 
        password : userInfo.password ,
        access_roles : userInfo.access_roles
    }, process.env.JWT_TOKEN_SECRET , {
        expiresIn: "15d",
    });


    return token;
};

export default generateTokenAndSetCookie;
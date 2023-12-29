import jwt from "jsonwebtoken";

const generateTokenAndSetCookie = (userInfo, res) => {

    const token = jwt.sign({ id : userInfo._id , password : userInfo.password }, "amplify", {
        expiresIn: "15d",
    });


    return token;
};

export default generateTokenAndSetCookie;
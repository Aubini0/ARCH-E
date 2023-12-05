import jwt from "jsonwebtoken";

const generateTokenAndSetCookie = (userId, res) => {
    const token = jwt.sign({ userId }, "amplify", {
        expiresIn: "15d",
    });


    return token;
};

export default generateTokenAndSetCookie;
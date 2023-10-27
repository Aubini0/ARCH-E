import jwt from "jsonwebtoken";

const generateTokenAndSetCookie = (userId, res) => {
  const token = jwt.sign({ userId }, "Hycienth", {
    expiresIn: "15d",
  });


  return token;
};

export default generateTokenAndSetCookie;

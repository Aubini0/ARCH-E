import crypto from "crypto";
import jwt from "jsonwebtoken";

const hashPassword = ( password )=>{
    password = crypto.pbkdf2Sync(
        password, process.env.HASHING_SALT,  
        1000, 64, `sha512`).toString(`hex`);     

    return password
}


const validatePassword = ( user , password )=>{
    let hash = crypto.pbkdf2Sync(password,  
        process.env.HASHING_SALT , 1000, 64, `sha512`).toString(`hex`); 

    return user.password === hash;     
}




const tokenizePayload = ( payload ) => {

    const token = jwt.sign(
        { ...payload }, 
        process.env.JWT_TOKEN_SECRET , 
        { expiresIn: "15d" }
    );

    return token;
};



const deTokenizePayload = ( token )=>{
    const decoded = jwt.verify(token, process.env.JWT_TOKEN_SECRET)
    return decoded;
}




export {
    hashPassword,
    tokenizePayload,
    validatePassword,
    deTokenizePayload,
    
}
import crypto from "crypto";

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





export {
    hashPassword,
    validatePassword,
}
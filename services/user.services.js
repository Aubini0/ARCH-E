import User from "../models/userModel.js";
import { upload, s3 } from "../db/bucketUploadClient.js";
import { sendOTP, makeid } from "../utils/helpers/generateOTP.js"
import generateTokenAndSetCookie from "../utils/helpers/generateTokenAndSetCookie.js";
import { 
    hashPassword , 
    validatePassword 
} from "../utils/helpers/passwordSettersAndValidators.js";
import { v4 as uuidv4 } from "uuid";
import { formatUserData , parsingBufferImage } from "../utils/helpers/commonFuncs.js"


import { uploadFileToS3 , deleteFileFromS3 } from "../utils/helpers/fileUploads.js"

const signUpService = async ( 
    full_name, 
    email, password, 
    age, phone, 
    profilePic , lat , 
    long ,ip
) => {
    let profPicLocation;
    const user = await User.findOne({ email });

    // check if user exists or not
    if (user) {
        throw {
            success: false,
            status: 400,
            message: "User already exists",
            };          

    }

    // make email
    // let username = makeid(9)
    let username = email;

    password = hashPassword(password)

    // upload profile picture if provided
    if (profilePic) {

        let { fileName , type , buf } = parsingBufferImage( profilePic )        

        profPicLocation = await uploadFileToS3( 
            `${fileName.substr(fileName.length - 15)}.${type}`,
            buf, 'base64', `image/${type}`,
            process.env.S3BUCKET_PROFILEIMAGES, 'public-read'
        )

    } 

    // add user to DB
    const newUser = new User({
        full_name : full_name,
        username: username, age: age, phone: phone,
        profilePic: profPicLocation, password : password,
        email: email, ip: ip, lat : lat, long : long
    });


    await newUser.save();
    if (newUser) {
        const token = await generateTokenAndSetCookie(newUser);

        formatUserData( newUser._doc )

        return{
            success: true,
            data : { ...newUser._doc },
            token,
            message : "Signed Up In Successfully"
        }

        
    } 
    else {
        throw {
            success: false,
            status: 400,
            message: "Invalid user data",
            };          
    }
};


const signInService = async ( 
    email, password, 
) => {
    

    const user = await User.findOne({ email });

    // check if user exists or not
    if (!user) {
        throw {
            success: false,
            status: 404,
            message: "Email Not Found",
            };          
    }

    if( validatePassword(  user , password ) ){
        const token = await generateTokenAndSetCookie(user);

        formatUserData( user._doc )

        return{
            success: true,
            data : { ...user._doc },
            token,
            message : "Logged In Successfully"
        }


    }
    else{
        throw {
            success: false,
            status: 400,
            message: "Password Incorrect",
            };          
    }

};


const verifyAccessService = async ( 
    req, 
) => {
    let userInfo = req.user._doc;
    let userToken = req.user.token;


    if(userInfo && userToken){
        formatUserData( userInfo )


        return {
            success: true,
            data : { ...userInfo },
            token : userToken,
            message: "Logged In Successfully",
            };          

    }

    throw {
        success: false,
        status: 404,
        message: "Record Not found",
    };          

    

}

const updateUserService = async(
    userInfo, full_name , password , 
    username, bio , age, profilePic
)=>{
        
        let existingUsername;

        if(username){
            existingUsername = await User.findOne({  username });
        }

        if(existingUsername){
            throw{
                success: false,
                status: 400,
                message: "Username already exist",        
            }
        }

        // hash password if provided
        if(password){
            password = hashPassword(password)
        }
        
        // upload profile picture if provided
        if (profilePic) {

            if(userInfo.profilePic){
                let img = userInfo.profilePic.split(".com/")[1].split("/")[1];
                await deleteFileFromS3( img , process.env.S3BUCKET_PROFILEIMAGES )
            }

            let { fileName , type , buf } = parsingBufferImage( profilePic )        



            profilePic = await uploadFileToS3( 
                `${fileName.substr(fileName.length - 15)}.${type}`,
                buf, 'base64', `image/${type}`,
                process.env.S3BUCKET_PROFILEIMAGES, 'public-read',
            )
        } 

        let updateData = {
            full_name , password, username,
            bio, age, profilePic    
        }

        let filter = {
            _id : userInfo._id
        }

        let updateUser = await User.findOneAndUpdate( filter , updateData , {new: true});

        formatUserData( updateUser._doc )

        return {
            success: true,
            data : { ...updateUser._doc },
            message: "User updated Successfully",
        };            

}


export {
    signUpService,
    signInService,
    verifyAccessService,
    updateUserService
    
}
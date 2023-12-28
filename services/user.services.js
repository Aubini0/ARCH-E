import User from "../models/userModel.js";
import { upload, s3 } from "../db/bucketUploadClient.js";
import { sendOTP, makeid } from "../utils/helpers/generateOTP.js"
import generateTokenAndSetCookie from "../utils/helpers/generateTokenAndSetCookie.js";
import { 
    hashPassword , 
    validatePassword 
} from "../utils/helpers/passwordSettersAndValidators.js";
import { v4 as uuidv4 } from "uuid";
import { formatUserData } from "../utils/helpers/commonFuncs.js"



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
        let buf = Buffer.from(profilePic.replace(/^data:image\/\w+;base64,/, ""), 'base64')

        let fileName = uuidv4();

        const type = profilePic.split(';')[0].split('/')[1];

        let params_data = {
            Key: `${fileName.substr(fileName.length - 15)}.${type}`,
            Body: buf,
            ContentEncoding: 'base64',
            ContentType: `image/${type}`,
            Bucket: "amplifibucketfiles",
            ACL: "public-read"
        };

        const { Location, Key } = await s3.upload(params_data).promise();
        let key = Key;
        profPicLocation = Location;

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
    let userInfo = req.user.userId;
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


export {
    signUpService,
    signInService,
    verifyAccessService
}
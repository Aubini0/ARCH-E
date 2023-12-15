import User from "../models/userModel.js";
import { upload, s3 } from "../db/bucketUploadClient.js";
import { sendOTP, makeid } from "../utils/helpers/generateOTP.js"
import generateTokenAndSetCookie from "../utils/helpers/generateTokenAndSetCookie.js";
import { 
    hashPassword , 
    validatePassword 
} from "../utils/helpers/passwordSettersAndValidators.js";


const signUpService = async ( 
    first_name,  last_name, 
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
        first_name: first_name, last_name: last_name,
        username: username, age: age, phone: phone,
        profilePic: profPicLocation, password : password,
        email: email, ip: ip, lat : lat, long : long
    });


    await newUser.save();
    if (newUser) {
        const token = await generateTokenAndSetCookie(newUser);

        return {
            success: true,
            _id: newUser._id,
            first_name: newUser.first_name,
            last_name: newUser.last_name,
            username: newUser.username,
            age: newUser.age,
            profilePic: newUser.profilePic,
            ip: newUser.ip,
            token: token,
            lat : lat,
            long : long
        };
        
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
            status: 400,
            message: "Email Not Found",
            };          
    }

    if( validatePassword(  user , password ) ){
        const token = await generateTokenAndSetCookie(user);
        return{
            success: true,
            _id: user._id,
            first_name: user.first_name,
            last_name: user.last_name,
            phone: user.phone,
            username: user.username,
            profilePic: user.profilePic,
            ip: user.ip,
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


export {
    signUpService,
    signInService
}
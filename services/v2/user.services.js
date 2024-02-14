import User from "../../models/userModel.js";
import {
    hashPassword,
} from "../../utils/helpers/passwordSettersAndValidators.js";
import { 
    formatUserData, 
    parsingBufferImage , 
} from "../../utils/helpers/commonFuncs.js"

import { uploadFileToS3, deleteFileFromS3 } from "../../utils/helpers/fileHandlers.js"

import { 
    findRecordById , 
} from "../../utils/helpers/commonDbQueries.js";



const updateUserServiceV2 = async (
    userInfo, full_name, password,
    username, bio, age, profilePic
) => {

    let existingUsername;

    if (username) {
        username = username.toLowerCase();
        existingUsername = await User.findOne({ username });
    }

    if (existingUsername) {
        throw {
            success: false,
            status: 400,
            message: "Username already exist",
        }
    }

    // hash password if provided
    if (password) {
        password = hashPassword(password)
    }

    // upload profile picture if provided
    if (profilePic) {

        if (userInfo.profilePic) {
            let img = userInfo.profilePic.split(".com/")[1].split("/")[1];
            await deleteFileFromS3(img, process.env.S3BUCKET_PROFILEIMAGES)
        }

        let { fileName, type, buf } = parsingBufferImage(profilePic)


        profilePic = await uploadFileToS3(
            `${fileName.substr(fileName.length - 15)}.${type}`,
            buf, 'base64', `image/${type}`,
            process.env.S3BUCKET_PROFILEIMAGES, 'public-read',
        )
    }

    let updateData = {
        full_name, password, username,
        bio, age, profilePic
    }

    let filter = {
        _id: userInfo._id
    }

    let updateUser = await User.findOneAndUpdate(filter, updateData, { new: true });

    formatUserData(updateUser._doc)

    return {
        success: true,
        data: { ...updateUser._doc },
        message: "User updated Successfully",
    };

}


const followUnFollowServiceV2 = async (currentUser, targetUserId) => {
    
    if( currentUser._id.toString() === targetUserId){
        throw {
            success: false,
            status: 400,
            message: "User cannot follow/unFollow him self",
        }
    }

    const targetUser = await findRecordById( User , targetUserId , "Clicked User not found" )

    const followed = currentUser.following.includes( targetUserId );

    if (followed) {
        // Unfollow user
        
        await User.findByIdAndUpdate(targetUserId, { $pull: { followers: currentUser._id } });
        await User.findByIdAndUpdate(currentUser._id, { $pull: { following: targetUserId } });
        return {
            success: true,
            data: { followed : !followed },
            message: "User Un-Followed Successfully",
        };

    } else {
        // Follow user
        await User.findByIdAndUpdate(targetUserId, { $push: { followers: currentUser._id } });
        await User.findByIdAndUpdate(currentUser._id, { $push: { following: targetUserId } });
        return {
            success: true,
            data: { followed : !followed },
            message: "User Followed Successfully",
        };
    }

};


export {
    updateUserServiceV2,
    followUnFollowServiceV2,
}
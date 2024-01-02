import Post from "../../models/postModel.js";
import User from "../../models/userModel.js";
import { uploadFileToS3  } from "../../utils/helpers/fileUploads.js"
import { parsingBufferAudio } from "../../utils/helpers/commonFuncs.js";

const createPostServiceV2 = async ( 
    userInfo , text , audio
) => {
    try{

        let { fileName , type , buf } = parsingBufferAudio( audio )        
        console.log({type})
        let audioPath = await uploadFileToS3( 
            `${fileName}`,
            buf, 'base64', `audio/${type}`,
            process.env.S3BUCKET_POSTAUDIOS, 'public-read'
        )
    
    
        // Assuming you have a database model named "AudioPost" for audio posts
        const post = new Post({
            postedBy: userInfo._id,
            text,
            audio: audioPath
        });
    
        await post.save();

        return {
            success: true,
            data : { ...post._doc },
            message: "Post Created Successfully",
        };            
    
    }
    catch(err){
        throw{
            success: false,
            status: 400,
            message: err.message,        
        }
    }
};



const getFeedPostServiceV2 = async( userId , page , limit )=>{

    let totalCount = await Post.countDocuments();

    totalCount = Math.round(totalCount / parseInt(limit))
    totalCount = totalCount == 0 ? 1 : totalCount    


    const feedPosts = await Post.find()
        .sort({ createdAt: -1 }) // Sort by most recent
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .populate({
            path : "postedBy",
            select : "-password -ip -createdAt -updatedAt -__v"
        })
        .exec();


    if (!feedPosts || feedPosts.length === 0) {
        throw{
            success: false,
            status: 404,
            message: "No feed posts found" ,        
        }
    }

    return {
        success: true,
        data : { feedPosts , totalCount },
        message: "Random posts returned Successfully",

    };    
}

export { createPostServiceV2 , getFeedPostServiceV2 }
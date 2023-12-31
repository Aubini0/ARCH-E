import Post from "../../models/postModel.js";
import User from "../../models/userModel.js";
import { uploadFileToS3  } from "../../utils/helpers/fileUploads.js"
import { parsingBufferAudio } from "../../utils/helpers/commonFuncs.js";

const createPostServiceV2 = async ( 
    userInfo , text , audio
) => {
    try{

        let { fileName , type , buf } = parsingBufferAudio( audio )        
        let audioPath = await uploadFileToS3( 
            `${fileName}`,
            buf, 'base64', `audio/mp3`,
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
        console.log(err)
        throw{
            success: false,
            status: 400,
            message: "Username already exist",        
        }
    }
};



const getFeedPostServiceV2 = async( userId )=>{
    let isAuthenticated = false;
    let user = null;
    // Pipeline for aggregation
    let pipeline = [];

    if (userId) {
        user = await User.findById(userId);

        if (user) {
            isAuthenticated = true;
        }
    }

    // Initial match stage to filter out the user's own posts
    let matchStage = {};
    if (isAuthenticated) {
        matchStage = {
            $match: {
                postedBy: { $nin: [userId] }, // Exclude the user's own posts
            },
        };
    }


    // Sample stage to get a random sample of 10 posts
    const sampleStage = { $sample: { size: 10 } };



    if (matchStage.$match) {
        pipeline.push(matchStage);
    }

    pipeline.push(sampleStage);

    console.log( pipeline )

    const feedPosts = await Post.aggregate(pipeline);

    if (!feedPosts || feedPosts.length === 0) {
        throw{
            success: false,
            status: 404,
            message: "No feed posts found" ,        
        }
    }

    return {
        success: true,
        data : { feedPosts },
        message: "Random posts returned Successfully",

    };    
}

export { createPostServiceV2 , getFeedPostServiceV2 }
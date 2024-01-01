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
    let pipeline = [
        {
            $lookup: {
                from: "users",           // The name of the collection to join with
                localField: "postedBy",  // The field from the posts collection
                foreignField: "_id",  // The field from the users collection
                as: "postedBy"           // The alias for the joined information
            }
        },
    ];

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

    pipeline.push(        
        {
            $project: {
                'postedBy.password': 0,
                'postedBy.__v' : 0,
                'postedBy.ip' : 0,
                'postedBy.createdAt' : 0,
                'postedBy.updatedAt' : 0
            }
        },        
    )
    pipeline.push(
        {
            $project: {
                _id: 1,
                'postedBy': 1,
                postedFrom: 1,
                parentPost: 1,
                repostCount: 1,
                text: 1,
                audio: 1,
                img: 1,
                likes: 1,
                upVote: 1,
                downVote: 1,
                replies: 1,
                createdAt: 1,
                updatedAt: 1
            }
        }        
    )




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
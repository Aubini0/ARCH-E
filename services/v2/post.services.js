import Post from "../../models/postModel.js";
import User from "../../models/userModel.js";
import Reply from "../../models/replyModel.js";
import { uploadFileToS3 } from "../../utils/helpers/fileUploads.js"
import { parsingBufferAudio } from "../../utils/helpers/commonFuncs.js";
import { 
    updateRecord ,
    createRecord ,
    findRecordById , 
} from "../../utils/helpers/commonDbQueries.js";

const createPostServiceV2 = async (
    userInfo, text, audio
) => {
    try {

        let { fileName, type, buf } = parsingBufferAudio(audio)
        // console.log({type})
        let audioPath = await uploadFileToS3(
            `${fileName}`,
            buf, 'base64',
            // `audio/${type}`,
            `audio/mp3`,
            process.env.S3BUCKET_POSTAUDIOS, 'public-read'
        )


        const postBody = {
            postedBy: userInfo._id,
            text,
            audio: audioPath
        }            

        const post = await createRecord( Post ,  postBody)

        return {
            success: true,
            data: { ...post._doc },
            message: "Post Created Successfully",
        };

    }
    catch (err) {
        throw {
            success: false,
            status: 400,
            message: err.message,
        }
    }
};


const getFeedPostServiceV2 = async (userId, page, limit) => {

    let totalCount = await Post.countDocuments();

    totalCount = Math.round(totalCount / parseInt(limit))
    totalCount = totalCount == 0 ? 1 : totalCount


    const feedPosts = await Post.find()
        .sort({ createdAt: -1 }) // Sort by most recent
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .populate({
            path: "postedBy",
            select: "-password -ip -createdAt -updatedAt -__v"
        })
        .exec();


    if (!feedPosts || feedPosts.length === 0) {
        throw {
            success: false,
            status: 404,
            message: "No feed posts found",
        }
    }

    return {
        success: true,
        data: { feedPosts, totalCount },
        message: "Random posts returned Successfully",
    };
}



const likeUnlikePostServiceV2 = async (currentUser, postId) => {

    const post = await findRecordById( Post ,  postId , "Post not found" )

    const liked = post.likes.includes(currentUser._id);

    if (liked) {
        await updateRecord( Post ,  postId , { $pull: { likes: currentUser._id } });
        return {
            success: true,
            data: { liked : !liked },
            message: "Post UnLiked Successfully",
        };
    }
    else {
        await updateRecord( Post ,  postId , { $push: { likes: currentUser._id } });

        return {
            success: true,
            data: { liked : !liked },
            message: "Post Liked Successfully",
        };
    }
};



const replyToPostServiceV2 = async ( currentUser , postId , text ) => {

    const post = await findRecordById( Post ,  postId , "Post not found" )

    const commentBody = {
        userId: currentUser._id,
        text: text,
        postId : postId,
        userProfilePic: currentUser.profilePic,
        username: currentUser.username,
    };


    const comment =  await createRecord( Reply , commentBody );

    const updatePostBody = { 
        $push: { replies: comment._id },
    }

    const updatedPost = await updateRecord( Post , postId , updatePostBody )
 

    return {
        success: true,
        data: { ...comment._doc },
        message: "Comment Added Successfully",
    };
};


export {
    createPostServiceV2,
    getFeedPostServiceV2,
    replyToPostServiceV2,
    likeUnlikePostServiceV2
}
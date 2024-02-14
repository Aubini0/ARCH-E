import Post from "../../models/postModel.js";
import Comment from "../../models/commentModel.js";
import { uploadFileToS3 , deleteFileFromS3 , convertWavToMp3 } from "../../utils/helpers/fileHandlers.js"
import { parsingBufferAudio , deleteFiles } from "../../utils/helpers/commonFuncs.js";
import { 
    updateRecord ,
    createRecord ,
    deleteRecord ,
    findRecordById , 
    getRecordsCount ,
    fetchPaginatedRecords
} from "../../utils/helpers/commonDbQueries.js";
import { Types } from 'mongoose'; // Import Types from mongoose


const createPostServiceV2 = async (
    userInfo, text, audio
) => {
    try {

        let { fileName, type, buf  } = parsingBufferAudio(audio);

        // convert base64 of webm audio to mp3
        let convertedFile = await convertWavToMp3( buf )

        // files just created for conversion
        // when our conversion code starts dealing in streams
        // then remove this snippet to remove files explcitly
        let filesToBeRemoved = [ 
            `localStorage/${convertedFile.file_key}.webm`,
            `localStorage/${convertedFile.file_key}.mp3`,
        ]
        deleteFiles(filesToBeRemoved)

        if(!convertedFile.status){
            throw {
                success: false,
                status: 400,
                message: "Error while converting file to MP3",
            }
        
        }


        let audioPath = await uploadFileToS3(
            `${fileName}`,
            convertedFile.buffer, 'base64',
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
        console.log({err})
        throw {
            success: false,
            status: 400,
            message: err.message,
        }
    }
};


const getFeedPostServiceV2 = async (userId, page, limit) => {

    const { ObjectId } = Types;
    let objectUserId;
    let feedPosts = []; 
    if(userId){
        objectUserId = new ObjectId(userId);
    }

    let totalCount = await getRecordsCount( Post , {}  , limit );


    let query_obj = {  }
    let sorted_criteria = { createdAt: -1 }
    let populate_criteria = { 
        path: "postedBy", select: "-password -ip -createdAt -updatedAt -__v" 
        }

    const rawFeedPosts = await fetchPaginatedRecords( 
        Post , query_obj , sorted_criteria , page , limit , populate_criteria
    )



    feedPosts = rawFeedPosts.map(post => {
        // Convert Mongoose document to plain JavaScript object
        const postObject = post.toObject();
        // Get total likes of this post
        const likesCount = post.likes.length;


        // Default values for followed & liked booleans
        postObject.postedBy.followed = false;
        postObject.liked = false;
        postObject.totalLikes = likesCount;

        // Check if userId is in followers list of the content creator
        if (postObject.postedBy.followers.includes(userId)) {
            postObject.postedBy.followed = true;
        }

        const userIdExists = postObject.likes.some(id => id.equals( objectUserId ));
        if (userIdExists) {
            postObject.liked = true;
        }



        return postObject;
    });



    if (!feedPosts || feedPosts.length === 0) {
        return {
            success: true,
            data: { feedPosts, totalCount },
            message: "Random posts returned Successfully",
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
    };


    const comment =  await createRecord( Comment , commentBody );

    const updatePostBody = { 
        // $push: { replies: comment._id },
        $inc: { totalComments: 1 },
    }

    const updatedPost = await updateRecord( Post , postId , updatePostBody )
 

    return {
        success: true,
        data: { ...comment._doc },
        message: "Comment Added Successfully",
    };
};



const getPostCommentsServiceV2 = async (postId, page, limit) => {

    await findRecordById( Post , postId , "Post Not Found against this ID" )

    let totalCount = await Comment.countDocuments({ postId });
    totalCount = Math.round(totalCount / parseInt(limit))
    totalCount = totalCount == 0 ? 1 : totalCount


    const rawComments = await Comment.find({ postId })
        .sort({ createdAt: -1 }) // Sort by most recent
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .populate({
           path: "userId", select: "_id username profilePic" 
        })        
        .exec();

    const comments = rawComments.map((comment) => {
        const commentObject = comment.toObject();
        commentObject.userProfilePic = commentObject.userId.profilePic;
        commentObject.username = commentObject.userId.username;
        commentObject.userId = commentObject.userId._id;

        return commentObject;

    });

    if (!comments || comments.length === 0) {
        throw {
            success: false,
            status: 404,
            message: "No Comments for this Post found",
        }
    }

    return {
        success: true,
        data: { comments , totalCount },
        message: "Comments returned Successfully",
    };
}



const getFollowedFeedPostServiceV2 = async (currentUser, page, limit) => {

    let followedIds = currentUser.following;
    let feedPosts = [];

    let totalCount = await getRecordsCount( Post ,  { postedBy: { $in: followedIds } } , limit )


    let query_obj = { postedBy: { $in: followedIds } }
    let sorted_criteria = { createdAt: -1 }
    let populate_criteria = { 
        path: "postedBy", select: "-password -ip -createdAt -updatedAt -__v" 
        }

    const rawFeedPosts = await fetchPaginatedRecords( 
        Post , query_obj , sorted_criteria , page , limit , populate_criteria
    )


    feedPosts = rawFeedPosts.map(post => {
        // Convert Mongoose document to plain JavaScript object
        const postObject = post.toObject();

        const likesCount = post.likes.length;

    
        // Default values for followed & liked booleans
        postObject.postedBy.followed = true;
        postObject.liked = false;
        postObject.totalLikes = likesCount;



        const userIdExists = postObject.likes.some(id => id.equals( currentUser._id ));
        if (userIdExists) {
            postObject.liked = true;
        }

        return postObject;
    });



    if (!feedPosts || feedPosts.length === 0) {
        return {
            success: true,
            data: { feedPosts , totalCount },
            message: "Followed Posts returned Successfully",    
        }
    }

    return {
        success: true,
        data: { feedPosts , totalCount },
        message: "Followed Posts returned Successfully",
    };
}




const deletePostServiceV2 = async ( currentUser , postId  ) => {
    const post = await findRecordById( Post ,  postId , "Post not found" );

    if( !currentUser.isSuperAdmin &&  ( post.postedBy.toString() !== currentUser._id.toString() ) ){
        throw {
            success: false,
            status: 401,
            message: "Unauthorized to delete this post",
        }
    }


    let audioFileName = post.audio.split(".com/")[1].split("/")[1];

    await deleteFileFromS3( audioFileName , process.env.S3BUCKET_POSTAUDIOS )

    let resp = await deleteRecord( Post , postId );

    

    return {
        success: true,
        data: {  },
        message: "Post Deleted Successfully",
    };

};



const deleteCommentServiceV2 = async ( currentUser , commentId  ) => {
    const comment = await findRecordById( Comment ,  commentId , "Comment not found" );

    if( !currentUser.isSuperAdmin && ( comment.userId.toString() !== currentUser._id.toString() ) ){
        throw {
            success: false,
            status: 401,
            message: "Unauthorized to delete this Comment",
        }
    }



    const updatePostBody = { 
        $inc: { totalComments: -1 },
    }
    const postId = comment.postId;

    const updatedPost = await updateRecord( Post , postId , updatePostBody )



    let resp = await deleteRecord( Comment , commentId );

    

    return {
        success: true,
        data: {  },
        message: "Comment Deleted Successfully",
    };

};


export {
    createPostServiceV2,
    deletePostServiceV2,
    getFeedPostServiceV2,
    replyToPostServiceV2,
    deleteCommentServiceV2,
    likeUnlikePostServiceV2,
    getPostCommentsServiceV2,
    getFollowedFeedPostServiceV2
}
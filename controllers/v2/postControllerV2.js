
import postValidation from "../../validatiors/v2/post.validators.js";
import { 
    createPostServiceV2 , 
    deletePostServiceV2 ,
    getFeedPostServiceV2 ,
    replyToPostServiceV2 ,
    deleteCommentServiceV2 ,
    likeUnlikePostServiceV2 ,
    getPostCommentsServiceV2,
    getFollowedFeedPostServiceV2
} from "../../services/v2/post.services.js"

const createPostV2 = async(req, res) => {
    try {
        const { 
            text , audio
        } = req.body;


        const userInfo = req.user;


        const JoiSchema = postValidation.createPost;
        await JoiSchema.validateAsync({
            text , audio
        });

        res.status(200).json(
            await createPostServiceV2( userInfo , text , audio )
        )


    } 
    catch (err) {
        // console.log({err})
        const { status } = err;
        const s = status ? status : 500;
        res.status(s).send({
          success: err.success,
          error: err.message,
        });
    

    }
};


const getFeedPostsV2 = async(req , res)=>{
    try {
        let { id : userId } = req.params  // Set userId to null if id is not provided
        let { page , limit } = req.query;

        page = page ? page == 0 ? 1 : page  : 1;
        limit =  limit ? limit  : 20
        page = parseInt(page);
        limit = parseInt(limit)

        const JoiSchema = postValidation.getFeedPosts;
        await JoiSchema.validateAsync({
            userId, page, limit
        });

        res.status(200).json(await getFeedPostServiceV2(userId , page , limit))


    } 
    catch (err) {
        console.log(err)
        const { status } = err;
        const s = status ? status : 500;
        res.status(s).send({
          success: err.success,
          error: err.message,
        });
    

    }

}


const likeUnlikePostV2 = async(req , res)=>{
    try {
        const { id: postId } = req.params;
        const currentUser = req.user;

        const JoiSchema = postValidation.likeUnLikePost;
        await JoiSchema.validateAsync({
            postId
        });

        res.status(200).json(
            await likeUnlikePostServiceV2( currentUser , postId )
        )


    } 
    catch (err) {
        console.log(err)
        const { status } = err;
        const s = status ? status : 500;
        res.status(s).send({
          success: err.success,
          error: err.message,
        });
    

    }
}


const replyToPostV2 = async(req , res)=>{
    try {
        const { postId ,  text } = req.body;
        const currentUser = req.user;

        const JoiSchema = postValidation.replyToPost;
        await JoiSchema.validateAsync({
            postId , text
        });

        res.status(200).json(
            await replyToPostServiceV2( currentUser , postId , text )
        )


    } 
    catch (err) {
        console.log(err)
        const { status } = err;
        const s = status ? status : 500;
        res.status(s).send({
          success: err.success,
          error: err.message,
        });
    

    }
}


const getPostCommentsV2 = async(req , res)=>{
    try {
        let { id : postId } = req.params  
        let { page , limit } = req.query;


        page = page ? page == 0 ? 1 : page  : 1;
        limit =  limit ? limit  : 20
        page = parseInt(page);
        limit = parseInt(limit)


        const JoiSchema = postValidation.getFeedPostComments;
        await JoiSchema.validateAsync({
            postId, page, limit
        });

        res.status(200).json( await getPostCommentsServiceV2( postId , page , limit ) )


    } 
    catch (err) {
        console.log(err)
        const { status } = err;
        const s = status ? status : 500;
        res.status(s).send({
          success: err.success,
          error: err.message,
        });
    

    }

}


const getFollowedFeedPostsV2 = async(req , res)=>{
    try {
        let { page , limit } = req.query;
        const currentUser = req.user;
        page = page ? page == 0 ? 1 : page  : 1;
        limit =  limit ? limit  : 20
        page = parseInt(page);
        limit = parseInt(limit)

        const JoiSchema = postValidation.getFeedPosts;
        await JoiSchema.validateAsync({
            page, limit
        });

        res.status(200).json( await getFollowedFeedPostServiceV2( currentUser , page , limit ) )


    } 
    catch (err) {
        console.log(err)
        const { status } = err;
        const s = status ? status : 500;
        res.status(s).send({
          success: err.success,
          error: err.message,
        });
    

    }

}




const deletePostV2 = async(req , res)=>{
    try {
        let { id : postId } = req.params;
        let currentUser = req.user;

        const JoiSchema = postValidation.deletePost;
        await JoiSchema.validateAsync({
            postId
        });

        res.status(200).json( await deletePostServiceV2(currentUser , postId) )


    } 
    catch (err) {
        console.log(err)
        const { status } = err;
        const s = status ? status : 500;
        res.status(s).send({
          success: err.success,
          error: err.message,
        });
    

    }
}



const deleteCommentV2 = async(req , res)=>{
    try {
        let { id : commentId } = req.params;
        let currentUser = req.user;

        const JoiSchema = postValidation.deleteComment;
        await JoiSchema.validateAsync({
            commentId
        });

        res.status(200).json( await deleteCommentServiceV2( currentUser , commentId ) );


    } 
    catch (err) {
        console.log(err)
        const { status } = err;
        const s = status ? status : 500;
        res.status(s).send({
          success: err.success,
          error: err.message,
        });
    

    }
}


export { 
    deletePostV2,
    createPostV2,
    replyToPostV2,
    getFeedPostsV2,
    deleteCommentV2,
    likeUnlikePostV2,
    getPostCommentsV2,
    getFollowedFeedPostsV2
};
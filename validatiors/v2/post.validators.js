import Joi from "joi"
import objectId from "joi-objectid"
import isBase64 from "is-base64";

Joi.objectId = objectId(Joi);


// Custom validation function for base64 encoded images
// const validateBase64Audio = (value, helpers) => {

//     if (!isBase64(value , { mimeRequired: true } )) {
//         return helpers.error('any.invalid');
//     }

//     console.log( "<----->" )


//     const buffer = Buffer.from(value, 'base64');


//     // You can add additional checks based on the image type or other criteria  
//     return buffer;
// };


const validateBase64Audio = (value, helpers) => {
    try {
        // Attempt to decode the Base64 string
        atob(value);
        return true;
    } catch (error) {
        console.log(error)
        // An error will be thrown if the string is not valid Base64
        return helpers.error('any.invalid');
    }
}




const postValidation = {
    createPost: Joi.object().keys({

        text: Joi.string()
            .error(() => {
                throw {
                    status: 400,
                    statusCode: 400,
                    success: false,
                    message: "Post Text is required",
                };
            }),

        audio: Joi.string()
            .required()
            .error(() => {
                throw {
                    status: 400,
                    statusCode: 400,
                    success: false,
                    message: "Audio should be a valid base64 audio string",
                };
            }),

    }),


    getFeedPosts: Joi.object().keys({

        userId: Joi.objectId()
            .error(() => {
                throw {
                    status: 400,
                    statusCode: 400,
                    success: false,
                    message: "Provide a valid userId",
                };
            }),

        page: Joi.number().integer().required()
            .error(() => {
                throw {
                    status: 400,
                    statusCode: 400,
                    success: false,
                    message: "Page No required",
                };
            }),

        limit: Joi.number().integer().required()
            .error(() => {
                throw {
                    status: 400,
                    statusCode: 400,
                    success: false,
                    message: "Number of rows required",
                };
            }),




    }),


    likeUnLikePost: Joi.object().keys({
        postId: Joi.objectId()
            .required()
            .error(() => {
                throw {
                    status: 400,
                    statusCode: 400,
                    success: false,
                    message: "Provide a valid postId",
                };
            })

    }),

    replyToPost: Joi.object().keys({
        postId: Joi.objectId()
            .required()
            .error(() => {
                throw {
                    status: 400,
                    statusCode: 400,
                    success: false,
                    message: "Provide a valid postId",
                };
        }),

        text: Joi.string()
            .required()
            .error(() => {
                throw {
                    status: 400,
                    statusCode: 400,
                    success: false,
                    message: "Comment Text is required",
                };
        })

    }),



    getFeedPostComments: Joi.object().keys({

        postId: Joi.objectId()
            .required()
            .error(() => {
                throw {
                    status: 400,
                    statusCode: 400,
                    success: false,
                    message: "Provide a valid postId",
                };
            }),

        page: Joi.number().integer().required()
            .error(() => {
                throw {
                    status: 400,
                    statusCode: 400,
                    success: false,
                    message: "Page No required",
                };
            }),

        limit: Joi.number().integer().required()
            .error(() => {
                throw {
                    status: 400,
                    statusCode: 400,
                    success: false,
                    message: "Number of rows required",
                };
            }),




    }),


    deletePost: Joi.object().keys({
        postId: Joi.objectId()
            .required()
            .error(() => {
                throw {
                    status: 400,
                    statusCode: 400,
                    success: false,
                    message: "Provide a valid postId",
                };
        })
    }),


    deleteComment: Joi.object().keys({
        commentId: Joi.objectId()
            .required()
            .error(() => {
                throw {
                    status: 400,
                    statusCode: 400,
                    success: false,
                    message: "Provide a valid commentId",
                };
        })
    }),


}


export default postValidation;

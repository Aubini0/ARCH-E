import Joi from "joi"
import objectId from "joi-objectid"
import isBase64 from "is-base64";

Joi.objectId = objectId(Joi);


// Custom validation function for base64 encoded images
const validateBase64Audio = (value, helpers) => {
    if (!isBase64(value , { mimeRequired: true } )) {
        return helpers.error('any.invalid');
    }


    const buffer = Buffer.from(value, 'base64');


    // You can add additional checks based on the image type or other criteria  
    return buffer;
};






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

        audio: Joi.string().custom(validateBase64Audio)
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


    }),



}


export default postValidation;

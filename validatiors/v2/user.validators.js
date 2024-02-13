import Joi from "joi"
import objectId from "joi-objectid"
import { validateBase64Image } from "../../utils/helpers/commonFuncs.js"

Joi.objectId = objectId(Joi);


const userValidation = {

    upadteUser: Joi.object().keys({
        full_name: Joi.string()
            .error(() => {
            throw {
                status: 400,
                statusCode: 400,
                success: false,
                message: "Full Name should be string",
            };
        }),

        password: Joi.string().min(6)
            .error(() => {
            throw {
                status: 400,
                statusCode: 400,
                success: false,
                message: "Password should be 6 character long",
            };
        }),

        
        username: Joi.string()
            .error(() => {
            throw {
                status: 400,
                statusCode: 400,
                success: false,
                message: "Username should be string",
            };
        }),


        
        bio: Joi.string().allow('')
            .error(() => {
            throw {
                status: 400,
                statusCode: 400,
                success: false,
                message: "Bio should be string",
            };
        }),

        
        age: Joi.number().integer()
          .error(() => {
            throw {
              status: 400,
              statusCode: 400,
              success: false,
              message: "Age is required & should be a number",
            };
          }),

        profilePic : Joi.string().custom( validateBase64Image )
            .error(() => {
            throw {
                status: 400,
                statusCode: 400,
                success: false,
                message: "Profile Pic should be a valid base64 string",
            };
        }),



    }),    

    followUnFollowUser: Joi.object().keys({
        targetUserId: Joi.objectId()
            .required()
            .error(() => {
                throw {
                    status: 400,
                    statusCode: 400,
                    success: false,
                    message: "Provide a valid userId",
                };
        })

    }),        
}


export default userValidation;

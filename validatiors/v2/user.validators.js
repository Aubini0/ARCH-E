import Joi from "joi"
import isBase64 from "is-base64";
import imageType from "image-type";


// Custom validation function for base64 encoded images
const validateBase64Image = (value, helpers) => {
    if (!isBase64(value, { mimeRequired: true })) {
      return helpers.error('any.invalid');
    }
  
    const buffer = Buffer.from(value, 'base64');
    const type = imageType(buffer);
  
    if (!type) {
      return helpers.error('any.invalid');
    }
  
    // You can add additional checks based on the image type or other criteria  
    return buffer;
};



const userValidation = {
    signUp: Joi.object().keys({
        age: Joi.number().integer()
          .required()
          .error(() => {
            throw {
              status: 400,
              statusCode: 400,
              success: false,
              message: "Age is required & should be a number",
            };
          }),

        lat: Joi.number()
            .required()
            .error(() => {
            throw {
                status: 400,
                statusCode: 400,
                success: false,
                message: "Latitute is required & should be a number",
            };
        }),

        long: Joi.number()
            .required()
            .error(() => {
            throw {
                status: 400,
                statusCode: 400,
                success: false,
                message: "Longitute is required & should be a number",
            };
        }),



        full_name: Joi.string()
            .required()
            .error(() => {
            throw {
                status: 400,
                statusCode: 400,
                success: false,
                message: "Full Name is required",
            };
        }),


        email: Joi.string().email()
            .required()
            .error(() => {
            throw {
                status: 400,
                statusCode: 400,
                success: false,
                message: "Valid Email is required",
            };
        }),


        password: Joi.string().min(6)
            .required()
            .error(() => {
            throw {
                status: 400,
                statusCode: 400,
                success: false,
                message: "Password is required & should be minimum 6 character long",
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

    signIn: Joi.object().keys({
        email: Joi.string().email()
            .required()
            .error(() => {
            throw {
                status: 400,
                statusCode: 400,
                success: false,
                message: "Valid Email is required",
            };
        }),

        password: Joi.string()
            .required()
            .error(() => {
            throw {
                status: 400,
                statusCode: 400,
                success: false,
                message: "Password is required",
            };
        }),


    }),    


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


        
        bio: Joi.string()
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

    
}


export default userValidation;

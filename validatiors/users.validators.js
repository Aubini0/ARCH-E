import Joi from "joi"

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

    
}


export default userValidation;

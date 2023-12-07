import Joi from "joi"

const userValidation = {
    signUp: Joi.object().keys({
        age: Joi.number().integer()
          .required()
          .error(() => {
            throw {
              status: 200,
              statusCode: 400,
              success: false,
              message: "Age is required & should be a number",
            };
          }),

        lat: Joi.number()
            .required()
            .error(() => {
            throw {
                status: 200,
                statusCode: 400,
                success: false,
                message: "Latitute is required & should be a number",
            };
        }),

        long: Joi.number()
            .required()
            .error(() => {
            throw {
                status: 200,
                statusCode: 400,
                success: false,
                message: "Longitute is required & should be a number",
            };
        }),



      }),
    
}


export default userValidation;

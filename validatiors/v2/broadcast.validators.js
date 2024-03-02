import Joi from "joi"
import objectId from "joi-objectid"


Joi.objectId = objectId(Joi);



const broadcastValidation = {

    pagination: Joi.object().keys({
        offset: Joi.number().integer()
            .error(() => {
                throw {
                    status: 400,
                    statusCode: 400,
                    success: false,
                    message: "Offset should be integer",
                };
            }),

        limit: Joi.number().integer()
            .error(() => {
                throw {
                    status: 400,
                    statusCode: 400,
                    success: false,
                    message: "Number of records should be integer",
                };
            }),
    }),



}


export default broadcastValidation;

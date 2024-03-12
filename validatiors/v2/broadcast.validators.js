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

    start: Joi.object().keys({
        name: Joi.string().required()
            .error(() => {
                throw {
                    status: 400,
                    statusCode: 400,
                    success: false,
                    message: "Broadcast name required",
                };
            }),

    }),


    join: Joi.object().keys({
        broadcastId: Joi.string().required()
            .error(() => {
                throw {
                    status: 400,
                    statusCode: 400,
                    success: false,
                    message: "Broadcast Id is required",
                };
            }),

    }),

    // TODO:
        // Make a custom validator to calidate songs uri
    play: Joi.object().keys({
        uri: Joi.string().required()
            .error(() => {
                throw {
                    status: 400,
                    statusCode: 400,
                    success: false,
                    message: "valid uri is required",
                };
            }),


        deviceId: Joi.string().required()
            .error(() => {
                throw {
                    status: 400,
                    statusCode: 400,
                    success: false,
                    message: "DeviceId is required",
                };
            }),


    }),



    search: Joi.object().keys({
        query: Joi.string().required()
            .error(() => {
                throw {
                    status: 400,
                    statusCode: 400,
                    success: false,
                    message: "Please provide some query to search",
                };
            })
    }),


}


export default broadcastValidation;

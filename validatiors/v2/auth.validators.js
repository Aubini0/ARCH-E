import Joi from "joi";
import { validateBase64Image } from "../../utils/helpers/commonFuncs.js";

const authValidation = {
  signUp: Joi.object().keys({
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

    email: Joi.string()
      .email()
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
      .min(6)
      .required()
      .error(() => {
        throw {
          status: 400,
          statusCode: 400,
          success: false,
          message: "Password is required & should be minimum 6 character long",
        };
      }),

    profilePic: Joi.string()
      .custom(validateBase64Image)
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
    email: Joi.string()
      .email()
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
};

export default authValidation;

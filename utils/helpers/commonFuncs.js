import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import isBase64 from "is-base64";
import imageType from "image-type";
import fs from "fs";
import crypto from "crypto";

import User from "../../models/userModel.js";
import { updateRecord } from "./commonDbQueries.js";

const formatUserData = (userInfo) => {
  let dropData = [
    "password",
    "createdAt",
    "updatedAt",
    "ip",
    "__v",
    "google_refresh_token",
  ];
  Object.keys(userInfo).map((item_) => {
    if (dropData.includes(item_)) {
      delete userInfo[item_];
    }
  });
};

const parsingBufferImage = (image) => {
  let buf = Buffer.from(
    image.replace(/^data:image\/\w+;base64,/, ""),
    "base64"
  );
  let fileName = uuidv4();
  const type = image.split(";")[0].split("/")[1];

  return { fileName, type, buf };
};

const parsingBufferAudio = (audio) => {
  let type;
  let stripped_audio = audio.split("base64,");

  if (stripped_audio.length > 1) {
    stripped_audio = stripped_audio[1];
    type = audio.split(";")[0].split("/")[1];
  } else {
    type = "mp3";
    stripped_audio = audio;
  }

  const buf = Buffer.from(stripped_audio, "base64");
  // const fileName = uuidv4() + `.${type}`;
  const fileName = uuidv4() + `.mp3`;

  return { fileName, type, buf };
};

const getRequest = async (url, headers) => {
  const { data } = await axios.get(url, {
    headers: { ...headers },
  });
  return data;
};

const postRequest = async (url, payload, headers) => {
  const { data } = await axios.post(url, payload, {
    headers: { ...headers },
  });

  return data;
};

const putRequest = async (url, payload, headers) => {
  const { data } = await axios.put(url, payload, {
    headers: { ...headers },
  });

  return data;
};

const calculateAge = (day, month, year) => {
  const currentDate = new Date();
  const birthDate = new Date(year, month - 1, day); // month is zero-indexed in JavaScript

  let age = currentDate.getFullYear() - birthDate.getFullYear();

  // Check if birthday has occurred this year
  if (
    currentDate.getMonth() < birthDate.getMonth() ||
    (currentDate.getMonth() === birthDate.getMonth() &&
      currentDate.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
};

const prepareRedirectUrl = (
  status_code,
  token,
  auth_type = 1,
  base_url = process.env.LOGIN_POPUP
) => {
  if (!token) {
    token = "";
  }
  if (!status_code) {
    status_code = 500;
  }
  let url = `${base_url}?status_code=${status_code}&auth_type=${auth_type}&token=${token}`;
  return url;
};

const validateBase64Image = (value, helpers) => {
  if (!isBase64(value, { mimeRequired: true })) {
    return helpers.error("any.invalid");
  }

  const buffer = Buffer.from(value, "base64");
  const type = imageType(buffer);

  if (!type) {
    return helpers.error("any.invalid");
  }

  // You can add additional checks based on the image type or other criteria
  return buffer;
};

const validateAudioMimeType = (value, helpers) => {
  if (!value instanceof String) {
    return helpers.error("any.invalid");
  }

  value = value.split("/");
  if (value.length <= 1) {
    return helpers.error("any.invalid");
  }

  if (value[0].toLowerCase() != "audio") {
    return helpers.error("any.invalid");
  }

  return true;
};

const deleteFiles = (filesToDelete) => {
  // Loop through the files and delete them
  filesToDelete.forEach((file) => {
    // Check if the file exists before attempting to delete
    if (fs.existsSync(file)) {
      // Delete the file
      fs.unlinkSync(file);
    }
  });
};

const generateRandomString = (length) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;

  let randomString = Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map((value) => characters.charAt(value % charactersLength))
    .join("");

  return randomString;
};

export {
  getRequest,
  putRequest,
  postRequest,
  deleteFiles,
  calculateAge,
  formatUserData,
  parsingBufferImage,
  parsingBufferAudio,
  prepareRedirectUrl,
  validateBase64Image,
  updateListenerCount,
  generateRandomString,
  validateAudioMimeType,
};

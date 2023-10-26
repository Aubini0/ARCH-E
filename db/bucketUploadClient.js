import multer from "multer";
import multerS3 from "multer-s3";
import AWS from "aws-sdk";
import dotenv from "dotenv";
import bluebird from "bluebird";

AWS.config.setPromisesDependency(bluebird);

dotenv.config();

const s3 = new AWS.S3({
    accessKeyId: process.env.S3ACCESSKEYID,
    secretAccessKey: process.env.S3SECRETACCESSKEY,
    region: process.env.REGION,
});

const upload = multer({
    limits: {
        fileSize: 1024 * 1024 * 5,
    },
    storage: multerS3({
        s3: s3,
        bucket: process.env.AWSS3BUCKETNAME,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        acl: "public-read",
        metadata: (req, file, cb) => {
            cb(null, { fieldName: file.fieldname });
        },
        key: (req, file, cb) => {
            cb(null, "files/" + Date.now().toString() + file.originalname);
        },
    }),
});



export { upload, s3 };
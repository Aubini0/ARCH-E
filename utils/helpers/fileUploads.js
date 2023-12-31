import { s3 } from "../../db/bucketUploadClient.js"


const uploadFileToS3 = async( 
    file_key = null , 
    file_body , 
    file_encoding , 
    file_contentType , 
    file_bucket,
    file_acl ,
    )=>{
    let params_data = {
        Key: file_key,
        Body: file_body,
        ContentEncoding: file_encoding,
        ContentType: file_contentType,
        Bucket: file_bucket,
        ACL: file_acl,
    };

    console.log({params_data})

    const { Location, Key } = await s3.upload(params_data).promise();
    return Location;
}

const deleteFileFromS3 =  async( file_key , file_bucket )=>{
    const params_remove = {
        Key: file_key,
        Bucket: file_bucket,
    }

    console.log({params_remove})

    let deleteResponce = await s3.deleteObject(params_remove).promise();
    return deleteResponce;
}


export {
    uploadFileToS3,
    deleteFileFromS3
}
import { s3 } from "../../db/bucketUploadClient.js"
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg';
import ffmpeg from "fluent-ffmpeg"
ffmpeg.setFfmpegPath(ffmpegPath);


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
        // ContentEncoding: file_encoding,
        ContentType: file_contentType,
        Bucket: file_bucket,
        ACL: file_acl,
    };

    // console.log({params_data})

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


const convertWavToMp3 = async( file_buffer ) =>{
    
    return await new Promise((resolve , reject)=>{
        const fileUuid = uuidv4();

        // save base64 webm to local
        const inputFilePath = `localStorage/${fileUuid}.webm`;
        fs.writeFileSync( inputFilePath , file_buffer )
        const outputFilePath = `localStorage/${fileUuid}.mp3`;


        // Convert WebM to MP3
        ffmpeg()
        .input(inputFilePath)
        .audioCodec('libmp3lame') // Set the audio codec to MP3
        .on('end', () => {
            // reading contents of recently saved mp3 file and pass its buffer
            const fileContent = fs.readFileSync(outputFilePath);
            resolve({status : true , buffer : fileContent , file_key : fileUuid})
        })
        .on('error', (err) => {
            reject({status : false , err : err , file_key : fileUuid})
        })
        // save output to mp3 file 
        .save(outputFilePath);

    })

}


export {
    uploadFileToS3,
    convertWavToMp3,
    deleteFileFromS3
}











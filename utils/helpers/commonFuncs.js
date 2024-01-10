import { v4 as uuidv4 } from "uuid";
import axios from "axios";

const formatUserData = ( userInfo )=>{
    let dropData = [ "password" , "createdAt" , "updatedAt" , "ip" , "__v" , "google_refresh_token" ];
    Object.keys( userInfo ).map((item_)=>{
        if (dropData.includes(item_)){
            delete userInfo[item_]
        }
    })
}


const parsingBufferImage = ( image )=>{
    let buf = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ""), 'base64')
    let fileName = uuidv4();
    const type = image.split(';')[0].split('/')[1];

    return { fileName , type , buf }
}


const parsingBufferAudio = ( audio )=>{
    let type;
    let stripped_audio = audio.split("base64,")

    if(stripped_audio.length > 1){
        stripped_audio = stripped_audio[1];
        type = audio.split(';')[0].split('/')[1];
    }
    else{
        type = "mp3"
        stripped_audio = audio;
    }

    const buf = Buffer.from(stripped_audio , 'base64');
    // const fileName = uuidv4() + `.${type}`; 
    const fileName = uuidv4() + `.mp3`; 

    return { fileName , type , buf }

}


const getRequest = async( url , headers )=>{
    const { data } = await axios.get(url, {
        headers: { ...headers },
    });

    return data;

}


const calculateAge = (day, month, year)=>{
    const currentDate = new Date();
    const birthDate = new Date(year, month - 1, day); // month is zero-indexed in JavaScript

    let age = currentDate.getFullYear() - birthDate.getFullYear();

    // Check if birthday has occurred this year
    if (
        currentDate.getMonth() < birthDate.getMonth() ||
        (currentDate.getMonth() === birthDate.getMonth() &&
        currentDate.getDate() < birthDate.getDate())
    ) 
    {
        age--;
    }

    return age;
}


const prepareRedirectUrl = ( status_code , token )=>{
    if(!token){ token = "" }
    if(!status_code){ status_code = 500 }
    let url = `${process.env.LOGIN_POPUP}?status_code=${status_code}&token=${token}`;
    return url;
}


export {
    getRequest,
    calculateAge,
    formatUserData,
    parsingBufferImage,
    parsingBufferAudio,
    prepareRedirectUrl
}
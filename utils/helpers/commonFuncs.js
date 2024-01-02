import { v4 as uuidv4 } from "uuid";

const formatUserData = ( userInfo )=>{
    let dropData = [ "password" , "createdAt" , "updatedAt" , "ip" , "__v" ];
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
    const fileName = uuidv4() + `.${type}`; 

    return { fileName , type , buf }

}


export {
    formatUserData,
    parsingBufferImage,
    parsingBufferAudio
}
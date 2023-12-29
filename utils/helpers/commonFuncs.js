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



export {
    formatUserData,
    parsingBufferImage
}
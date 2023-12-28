const formatUserData = ( userInfo )=>{
    let dropData = [ "password" , "createdAt" , "updatedAt" , "ip" , "__v" ];
    Object.keys( userInfo ).map((item_)=>{
        if (dropData.includes(item_)){
            delete userInfo[item_]
        }
    })
}

export {
    formatUserData
}
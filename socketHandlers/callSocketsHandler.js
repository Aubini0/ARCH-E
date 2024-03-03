

const joinQueue = async( socket , data, queue )=>{
    let payload = data.payload;
    queue[ payload.email   ] = socket
    matchUsers( queue )
}

const leaveQueue = async( data , queue )=>{
    let payload = data.payload;
    delete queue[ payload._id ]
}

const getOnlineUsers = async( queue )=>{
    console.log({queue})
}

const matchUsers = ( queue )=>{
    let keys_ = Object.keys(queue);
    console.log( "Queued_Users > " , keys_ )
    if ( keys_.length >= 2) {

        // const user1 = queue.shift();
        // const user2 = queue.shift();
        
        let user1 = queue[keys_[0]]
        let user2 = queue[keys_[1]]




        // This channle name needs to be unique having combo of host_id-uniquestamp
        let channel_name = `${keys_[0]}-${keys_[1]}`

        user1.emit('matched', { payload : { userId : keys_[1] , channel_name , username : keys_[1] }   });
        user2.emit('matched', { payload : { userId : keys_[0] , channel_name , username : keys_[0] }  } );


        delete queue[keys_[0]]
        delete queue[keys_[1]]


        console.log('Users matched > ' , queue);
    }
}



export { 
    joinQueue ,
    leaveQueue,
    getOnlineUsers
};

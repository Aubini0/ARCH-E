import User from "../models/userModel.js"
import { updateRecord } from "../utils/helpers/commonDbQueries.js";

const addBroadcastListner = async( data )=>{    
    let payload = data.payload;
    let { device_id , token : spotify_access_token } = payload
    console.log({payload})
    if (payload.device_id && payload.hostId){
        let updateBody = { $push: 
            { broadcastListeners: { device_id , spotify_access_token } }
        }
    
        let userUpdateResp = await updateRecord( User , payload.hostId , updateBody );
        
    }
}


export { 
    addBroadcastListner
};

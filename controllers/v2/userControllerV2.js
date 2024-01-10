import userValidation from "../../validatiors/v2/user.validators.js";
import { 
    followUnFollowServiceV2,
    gogogleAuthServiceV2,
    googleCallBackServiceV2
 } from "../../services/v2/user.services.js";






const followUnFollowUserV2 = async(req, res) => {
    try {
        const { id : targetUserId } = req.params;
        const currentUser = req.user;


        const JoiSchema = userValidation.followUnFollowUser;
        await JoiSchema.validateAsync({
            targetUserId
        });

        res.status(200).json(
            await followUnFollowServiceV2( currentUser , targetUserId )
        )


    } 
    catch (err) {
        // console.log({err})
        const { status } = err;
        const s = status ? status : 500;
        res.status(s).send({
          success: err.success,
          error: err.message,
        });
    

    }
};


const googleAuthV2 = async(req, res) => {
    try {
        const url = await gogogleAuthServiceV2()
        res.redirect(url);
    } 
    catch (err) {
        // console.log({err})
        const { status } = err;
        const s = status ? status : 500;
        res.status(s).send({
          success: err.success,
          error: err.message,
        });
    }
};



const googleCallBackV2 = async(req , res)=>{
    const { code } = req.query;
    const ip = req.ip;


    try {
        let redirectUrl = await googleCallBackServiceV2( code , ip )
        res.redirect( redirectUrl );
    }
    catch(err){
        console.error('Error:', err);
        res.json({ status : false })    
    }

}

export { 
    followUnFollowUserV2,
    googleCallBackV2,
    googleAuthV2
};
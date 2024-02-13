import userValidation from "../../validatiors/v2/user.validators.js";
import { 
    followUnFollowServiceV2,
    // gogogleAuthServiceV2,
    // googleCallBackServiceV2,
    updateUserServiceV2,
 } from "../../services/v2/user.services.js";


//  import { 
//     prepareRedirectUrl
// } from "../../utils/helpers/commonFuncs.js"





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

// --------------- Moved to auth controller ---------------- //
// const googleAuthV2 = async(req, res) => {
//     try {
//         res.status(200).json( await gogogleAuthServiceV2() )

//     } 
//     catch (err) {
//         // console.log({err})
//         const { status } = err;
//         const s = status ? status : 500;
//         res.status(s).send({
//           success: err.success,
//           error: err.message,
//         });
//     }
// };
// const googleCallBackV2 = async(req , res)=>{
//     let redirectUrl;
//     const { code } = req.query;
//     const ip = req.ip;

//     try {
//         redirectUrl = await googleCallBackServiceV2( code , ip )
//     }
//     catch(err){
//         console.error('Error:', err);
//         redirectUrl = prepareRedirectUrl( 400  )
//     }

//     res.redirect( redirectUrl );


// }
// --------------- Moved to auth controller ---------------- //



const updateUserV2 = async(req , res)=>{
    try {
        const { 
            full_name , password , username, 
            bio , age , profilePic } = req.body;
        const userInfo = req.user;

        const JoiSchema = userValidation.upadteUser;
        await JoiSchema.validateAsync({
            full_name, password, 
            username, bio , age,
            profilePic
        });


        res.status(200).json(
            await updateUserServiceV2(
                userInfo, full_name,
                password, username,
                bio, age, profilePic
        ))


    } catch (err) {
        const { status } = err;
        const s = status ? status : 500;
        res.status(s).send({
          success: err.success,
          error: err.message,
        });

    }
}


export { 
    followUnFollowUserV2,
    // googleCallBackV2,
    // googleAuthV2,
    updateUserV2,
};
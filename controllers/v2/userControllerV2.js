import userValidation from "../../validatiors/v2/user.validators.js";
import { 
    followUnFollowServiceV2,
    gogogleAuthServiceV2,
    googleCallBackServiceV2,
    signUpService
 } from "../../services/v2/user.services.js";


 import { 
    prepareRedirectUrl
} from "../../utils/helpers/commonFuncs.js"





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
        res.status(200).json( await gogogleAuthServiceV2() )

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
    let redirectUrl;
    const { code } = req.query;
    const ip = req.ip;

    try {
        redirectUrl = await googleCallBackServiceV2( code , ip )
    }
    catch(err){
        console.error('Error:', err);
        redirectUrl = prepareRedirectUrl( 400  )
    }

    res.redirect( redirectUrl );


}



const signupSuperAdminV2 = async(req, res) => {
    try {
        const { 
            full_name, 
            email,password, age, 
            profilePic , phone,
            lat , long 
        } = req.body;

        const ip = req.ip;



        const JoiSchema = userValidation.signUp;
        await JoiSchema.validateAsync({
            age, lat,
            long, full_name,
            email, password, 
            profilePic
        });

        let isSuperAdmin = true

        res.status(200).json(
            await signUpService(
                full_name, 
                email, password,
                age, phone, profilePic , 
                lat ,long  ,ip  , isSuperAdmin
            )
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

export { 
    followUnFollowUserV2,
    signupSuperAdminV2,
    googleCallBackV2,
    googleAuthV2,
};
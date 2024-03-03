import authValidation from "../../validatiors/v2/auth.validators.js";
import { 
    signUpServiceV2,
    signInServiceV2,
    verifyAccessServiceV2,
    gogogleAuthServiceV2,
    googleCallBackServiceV2,
    spotifyAuthServiceV2,
    spotifyCallBackServiceV2,
    spotifyConnectToInternalServiceV2
 } from "../../services/v2/auth.service.js";


 import { 
    prepareRedirectUrl
} from "../../utils/helpers/commonFuncs.js"



const signupUserV2 = async(req, res) => {
    try {
        const { 
            full_name, 
            email,password, age, 
            profilePic , phone,
            lat , long 
        } = req.body;

        const ip = req.ip;



        const JoiSchema = authValidation.signUp;
        await JoiSchema.validateAsync({
            age, lat,
            long, full_name,
            email, password, 
            profilePic
        });

        res.status(200).json(
            await signUpServiceV2(
                full_name, 
                email, password,
                age, phone, profilePic , 
                lat ,long  ,ip 
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

const loginUserV2 = async(req, res) => {
    try {
        const { email , password } = req.body;

        const JoiSchema = authValidation.signIn;
        await JoiSchema.validateAsync({
            email, password, 
        });


        res.status(200).json(
            await signInServiceV2(
                email, password,
            ))


    } catch (err) {
        const { status } = err;
        const s = status ? status : 500;
        res.status(s).send({
          success: err.success,
          error: err.message,
        });

    }
};

const verifyAccessV2 = async(req, res) => {
    try {
        res.status(200).json(
            await verifyAccessServiceV2( req )
        );

    } catch (err) {
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



        const JoiSchema = authValidation.signUp;
        await JoiSchema.validateAsync({
            age, lat,
            long, full_name,
            email, password, 
            profilePic
        });

        let isSuperAdmin = true

        res.status(200).json(
            await signUpServiceV2(
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

const spotifyAuthV2 = async(req , res)=>{
    try {
        res.status(200).json( await spotifyAuthServiceV2() )
    } 
    catch (err) {
        const { status } = err;
        const s = status ? status : 500;
        res.status(s).send({
          success: err.success,
          error: err.message,
        });
    }
}

const spotifyCallBackV2 = async(req , res)=>{
    let redirectUrl;
    const { code , state } = req.query;
    const ip = req.ip;

    try {
        redirectUrl = await spotifyCallBackServiceV2( code , state , ip )
        console.log({redirectUrl})
    }
    catch(err){
        console.error('Error:', err);
        redirectUrl = prepareRedirectUrl( 400 , "" , process.env.BORADCAST_POPUP  )
    }

    res.redirect( redirectUrl );

}


const spotifyConnectToInternalV2 = async(req , res)=>{
    try {
        const { spotifyToken } = req.body;
        const currentUser = req.user;

        const JoiSchema = authValidation.connectSpotifyInternal;
        
        await JoiSchema.validateAsync({
            spotifyToken 
        });


        res.status(200).json(
            await spotifyConnectToInternalServiceV2(
                spotifyToken , currentUser
        ))


    } 
    catch (err) {
        const { status } = err;
        const s = status ? status : 500;
        res.status(s).send({
          success: err.success,
          error: err.message,
        });

    }    
}




export { 
    loginUserV2,
    signupUserV2,
    verifyAccessV2,
    signupSuperAdminV2,
    googleAuthV2,
    googleCallBackV2,
    spotifyAuthV2,
    spotifyCallBackV2,
    spotifyConnectToInternalV2
};
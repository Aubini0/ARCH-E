import userValidation from "../../validatiors/v2/user.validators.js";
// import { createPostServiceV2  , getFeedPostServiceV2} from "../../services/v2/post.services.js"
import { followUnFollowServiceV2 } from "../../services/v2/user.services.js";

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


export { 
    followUnFollowUserV2,
};
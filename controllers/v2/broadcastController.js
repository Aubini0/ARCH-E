import { 
    fetchUserPlayListsServiceV2,
 } from "../../services/v2/broadcast.service.js";
import broadcastValidation from "../../validatiors/v2/broadcast.validators.js"


const fetchPlayListsV2 = async(req, res) => {
    try {
        const userInfo = req.user;
        let { offset , limit } = req.query;


        limit = limit ? limit : 20
        offset = offset ? offset : 0

        TODO: 
            // Add checks for limit & offset ranges 

        limit = parseInt(limit)
        offset = parseInt(offset);


        const JoiSchema = broadcastValidation.pagination;
        await JoiSchema.validateAsync({
            offset, limit
        });



        res.status(200).json(
            await fetchUserPlayListsServiceV2( userInfo , limit , offset  )
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





export { 
    fetchPlayListsV2,
};
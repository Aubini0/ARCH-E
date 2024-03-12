import { 
    joinBroadcastServiceV2,
    startBroadcastServiceV2,
    searchFromSpotifyServiceV2,
    playSongInBroadcastServiceV2,
    fetchFromSpotifyLibraryServiceV2,
 } from "../../services/v2/broadcast.service.js";
import broadcastValidation from "../../validatiors/v2/broadcast.validators.js"


const fetchSavedTracksV2 = async(req, res) => {
    try {
        const userInfo = req.user;
        let { offset , limit } = req.query;
        let savedTracksBaseUrl = "https://api.spotify.com/v1/me/tracks";


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
            await fetchFromSpotifyLibraryServiceV2( 
                savedTracksBaseUrl , userInfo , 
                limit , offset  
        ));

    } catch (err) {
        const { status } = err;
        const s = status ? status : 500;
        res.status(s).send({
          success: err.success,
          error: err.message,
        });

    }
};

const fetchSavedPlaylistsV2 = async(req, res) => {
    try {
        const userInfo = req.user;
        let { offset , limit } = req.query;
        let playListsBaseUrl = "https://api.spotify.com/v1/me/playlists";


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
            await fetchFromSpotifyLibraryServiceV2(
                playListsBaseUrl , userInfo , 
                limit , offset  
        ));

    } catch (err) {
        const { status } = err;
        const s = status ? status : 500;
        res.status(s).send({
          success: err.success,
          error: err.message,
        });

    }
};

const startBroadcastV2 = async(req, res) => {
    try {
        const userInfo = req.user;
        let { name } = req.body;

        const JoiSchema = broadcastValidation.start;
        await JoiSchema.validateAsync({
            name
        });

        res.status(200).json(
            await startBroadcastServiceV2( name , userInfo)
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

const joinBroadcastV2 = async(req, res) => {
    try {
        const userInfo = req.user;
        let { broadcastId } = req.body;

        const JoiSchema = broadcastValidation.join;
        await JoiSchema.validateAsync({
            broadcastId
        });        

        res.status(200).json(
            await joinBroadcastServiceV2( broadcastId , userInfo)
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

const playSongInBroadcastV2 = async(req, res) => {
    try {
        const userInfo = req.user;
        let { deviceId , uri } = req.body;

        const JoiSchema = broadcastValidation.play;
        await JoiSchema.validateAsync({
            uri , deviceId
        });        

        res.status(200).json(
            await playSongInBroadcastServiceV2( uri , deviceId , userInfo)
        );


    } catch (err) {
        console.log({err})
        const { status } = err;
        const s = status ? status : 500;
        res.status(s).send({
          success: err.success,
          error: err.message,
        });

    }
};




const fetchSearchResultsV2 = async(req, res) => {
    try {
        const userInfo = req.user;
        let { query , offset , limit } = req.query;
        let searchBaseUrl = "https://api.spotify.com/v1/search";


        limit = limit ? limit : 20
        offset = offset ? offset : 0

        TODO: 
            // Add checks for limit & offset ranges 

        limit = parseInt(limit)
        offset = parseInt(offset);

        const searchJoiSchema = broadcastValidation.search;
        const paginationJoiSchema = broadcastValidation.pagination;
        await paginationJoiSchema.validateAsync({
            offset, limit
        });
        await searchJoiSchema.validateAsync({
            query
        });


        res.status(200).json(
            await searchFromSpotifyServiceV2(
                userInfo , searchBaseUrl , query , limit , offset
        ));


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
    joinBroadcastV2,
    startBroadcastV2,
    fetchSavedTracksV2, 
    fetchSearchResultsV2,   
    playSongInBroadcastV2,
    fetchSavedPlaylistsV2,
    
};
import express from "express";

import { 
    searchBotInvoke
} from "../../controllers/v2/botController.js";

const router = express.Router();


router.get("/search", searchBotInvoke);
router.post("/search", searchBotInvoke);

export default router;

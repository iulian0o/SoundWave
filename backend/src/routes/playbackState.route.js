import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getPlaybackState, savePlaybackState } from './../controllers/playbackState.controller.js';

const router = Router();

router.get('/', protectRoute, getPlaybackState);
router.put('/', protectRoute, savePlaybackState);

export default router;
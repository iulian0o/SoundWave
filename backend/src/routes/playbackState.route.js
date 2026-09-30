import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getPlaybackState, savePlaybackState, saveQueue } from './../controllers/playbackState.controller.js';

const router = Router();

router.get('/', protectRoute, getPlaybackState);
router.put('/', protectRoute, savePlaybackState);
router.put('/queue', protectRoute, saveQueue);

export default router;
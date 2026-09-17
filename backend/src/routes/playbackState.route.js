import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware";
import { getPlaybackState, savePlaybackState } from './../controllers/playbackState.controller';

const router = Router();

router.get('/', protectRoute, getPlaybackState);
router.put('/', protectRoute, savePlaybackState);

export default router;
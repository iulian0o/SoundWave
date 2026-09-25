import { Router } from "express";
import {
  createSong,
  deleteSong,
  updateSong,
  createAlbum,
  updateAlbum,
  deleteAlbum,
  checkAdmin,
} from "../controllers/admin.controller.js";
import { protectRoute, requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/check", checkAdmin);

router.use(protectRoute, requireAdmin);

router.post("/songs", createSong);
router.patch("/songs/:id", updateSong);
router.delete("/songs/:id", deleteSong);

router.post("/albums", createAlbum);
router.patch("/albums/:id", updateAlbum);
router.delete("/albums/:id", deleteAlbum);

export default router;

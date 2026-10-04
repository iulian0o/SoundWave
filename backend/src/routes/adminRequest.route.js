import { Router } from "express";
import {
  createRequest,
  getMyRequest,
  listRequests,
  approveRequest,
  rejectRequest,
} from "../controllers/adminRequest.controller.js";
import { protectRoute, requireSuperAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protectRoute);

router.post('/', createRequest);
router.get('/me', getMyRequest);

router.get('/', requireSuperAdmin, listRequests);
router.patch('/:id/approve', requireSuperAdmin, approveRequest);
router.patch('/:id/reject', requireSuperAdmin, rejectRequest);

export default router;
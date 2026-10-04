import mongoose from 'mongoose';
import { AdminRequest } from '../models/adminRequest.model.js';
import { User } from '../models/user.model.js';
import { getAdminStatus } from '../middleware/auth.middleware.js';

const STATUSES = ["pending", "approved", "rejected"];

export const createRequest = async (req, res, next) => {
  try {
    const { userId } = req.auth();
    const reason = typeof req.body.reason === "string"
      ? req.body.reason.trim().slice(0, 300)
      : "";

    const { isAdmin } = await getAdminStatus(userId);
    if (isAdmin) {
      return res.status(409).json({ message: "You already have admin access" });
    }

    const request = await AdminRequest.create({ clerkId: userId, reason });
    res.status(201).json(request);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "You already have a pending request" });
    }
    next(error);
  }
};

export const getMyRequest = async (req, res, next) => {
  try {
    const { userId } = req.auth();
    const request = await AdminRequest.findOne({ clerkId: userId })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(request ?? null);
  } catch (error) {
    next(error);
  }
};

export const listRequests = async (req, res, next) => {
  try {
    const status = STATUSES.includes(req.query.status) ? req.query.status : "pending";

    const requests = await AdminRequest.find({ status })
      .sort({ createdAt: -1 })
      .lean();

    const users = await User.find({ clerkId: { $in: requests.map((r) => r.clerkId) } })
      .select("clerkId fullName imageUrl")
      .lean();
    const byClerkId = new Map(users.map((u) => [u.clerkId, u]));

    res.status(200).json(
      requests.map((r) => ({
        ...r,
        user: byClerkId.get(r.clerkId)
          ? { fullName: byClerkId.get(r.clerkId).fullName, imageUrl: byClerkId.get(r.clerkId).imageUrl }
          : null,
      }))
    );
  } catch (error) {
    next(error);
  }
};

export const approveRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid request id" });
    }

    const request = await AdminRequest.findOne({ _id: id, status: "pending" });
    if (!request) {
      return res.status(404).json({ message: "Request not found or already reviewed" });
    }

    const user = await User.findOneAndUpdate(
      { clerkId: request.clerkId },
      { role: "admin" }
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    request.status = "approved";
    request.reviewedAt = new Date();
    await request.save();

    res.status(200).json(request);
  } catch (error) {
    next(error);
  }
};

export const rejectRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid request id" });
    }

    const request = await AdminRequest.findOneAndUpdate(
      { _id: id, status: "pending" },
      { status: "rejected", reviewedAt: new Date() },
      { new: true }
    );
    if (!request) {
      return res.status(404).json({ message: "Request not found or already reviewed" });
    }

    res.status(200).json(request);
  } catch (error) {
    next(error);
  }
};
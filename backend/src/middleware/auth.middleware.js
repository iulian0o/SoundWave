import { clerkClient } from '@clerk/express';
import { User } from '../models/user.model.js';

export const getAdminStatus = async (userId) => {
  const clerkUser = await clerkClient.users.getUser(userId);
  const email = clerkUser.primaryEmailAddress?.emailAddress;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (adminEmail && email === adminEmail) {
    return { isAdmin: true, isSuperAdmin: true };
  }

  const dbUser = await User.findOne({ clerkId: userId }).select("role").lean();
  return { isAdmin: dbUser?.role === "admin", isSuperAdmin: false };
};

export const protectRoute = async (req, res, next) => {
  const { userId } = req.auth();

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized - you must be logged in" });
  }
  next();
}

export const requireAdmin = async (req, res, next) => {
  try {
    const { userId } = req.auth();
    const { isAdmin } = await getAdminStatus(userId);

    if (!isAdmin) {
      return res.status(403).json({ message: "Unauthorized - you must be an admin" });
    }
    next();
  } catch (error) {
    next(error);
  }
}

export const requireSuperAdmin = async (req, res, next) => {
  try {
    const { userId } = req.auth();
    const { isSuperAdmin } = await getAdminStatus(userId);

    if (!isSuperAdmin) {
      return res.status(403).json({ message: "Forbidden - super admin only" });
    }
    next();
  } catch (error) {
    next(error);
  }
}
import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { protectRoute, requireAdmin, requireSuperAdmin } from "./auth.middleware.js";
import { clerkClient } from "@clerk/express";
import { User } from '../models/user.model.js';

vi.mock("@clerk/express", () => ({
  clerkClient: { users: { getUser: vi.fn() } },
}));

vi.mock("../models/user.model.js", () => ({ User: { findOne: vi.fn() } }));

const mockDbUser = (doc) =>
  User.findOne.mockReturnValue({
    select: () => ({ lean: () => Promise.resolve(doc) }),
  });

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe("requireAdmin", () => {
  const ORIGINAL_ADMIN_EMAIL = process.env.ADMIN_EMAIL;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_EMAIL = "admin@example.com";
    mockDbUser(null);
  });

  afterAll(() => {
    process.env.ADMIN_EMAIL = ORIGINAL_ADMIN_EMAIL;
  });

  it("calls next() when the user's email matches ADMIN_EMAIL", async () => {
    clerkClient.users.getUser.mockResolvedValueOnce({
      primaryEmailAddress: { emailAddress: "admin@example.com" },
    });
    const req = { auth: () => ({ userId: "user_123" }) };
    const res = mockRes();
    const next = vi.fn();

    await requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("calls next() when the DB role is admin", async () => {
    clerkClient.users.getUser.mockResolvedValueOnce({
      primaryEmailAddress: { emailAddress: "someone-else@example.com" },
    });
    mockDbUser({ role: "admin" });
    const req = { auth: () => ({ userId: "user_456" }) };
    const res = mockRes();
    const next = vi.fn();

    await requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("returns 403 when the email doesn't match and the DB role is not admin", async () => {
    clerkClient.users.getUser.mockResolvedValueOnce({
      primaryEmailAddress: { emailAddress: "someone-else@example.com" },
    });
    const req = { auth: () => ({ userId: "user_456" }) };
    const res = mockRes();
    const next = vi.fn();

    await requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("passes the error to next() when the Clerk lookup throws", async () => {
    const clerkError = new Error("Clerk API unavailable");
    clerkClient.users.getUser.mockRejectedValueOnce(clerkError);
    const req = { auth: () => ({ userId: "user_789" }) };
    const res = mockRes();
    const next = vi.fn();

    await requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledWith(clerkError);
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe("requireSuperAdmin", () => {
  const ORIGINAL_ADMIN_EMAIL = process.env.ADMIN_EMAIL;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_EMAIL = "admin@example.com";
    mockDbUser(null);
  });

  afterAll(() => {
    process.env.ADMIN_EMAIL = ORIGINAL_ADMIN_EMAIL;
  });

  it("calls next() for the env admin", async () => {
    clerkClient.users.getUser.mockResolvedValueOnce({
      primaryEmailAddress: { emailAddress: "admin@example.com" },
    });
    const next = vi.fn();

    await requireSuperAdmin({ auth: () => ({ userId: "u1" }) }, mockRes(), next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("returns 403 for a DB admin (not the super admin)", async () => {
    clerkClient.users.getUser.mockResolvedValueOnce({
      primaryEmailAddress: { emailAddress: "someone-else@example.com" },
    });
    mockDbUser({ role: "admin" });
    const res = mockRes();
    const next = vi.fn();

    await requireSuperAdmin({ auth: () => ({ userId: "u2" }) }, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when ADMIN_EMAIL is unset and the user has no email", async () => {
    delete process.env.ADMIN_EMAIL;
    clerkClient.users.getUser.mockResolvedValueOnce({ primaryEmailAddress: null });
    const res = mockRes();
    const next = vi.fn();

    await requireSuperAdmin({ auth: () => ({ userId: "u3" }) }, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});
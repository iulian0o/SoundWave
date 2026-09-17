import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { protectRoute, requireAdmin } from "./auth.middleware.js";
import { clerkClient } from "@clerk/express";

vi.mock("@clerk/express", () => ({
  clerkClient: { users: { getUser: vi.fn() } },
}));

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe("protectRoute", () => {
  it("returns 401 when there is no userId", async () => {
    const req = { auth: () => ({ userId: null }) };
    const res = mockRes();
    const next = vi.fn();

    await protectRoute(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next() when a userId is present", async () => {
    const req = { auth: () => ({ userId: "user_123" }) };
    const res = mockRes();
    const next = vi.fn();

    await protectRoute(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe("requireAdmin", () => {
  const ORIGINAL_ADMIN_EMAIL = process.env.ADMIN_EMAIL;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_EMAIL = "admin@example.com";
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

  it("returns 403 when the user's email does not match ADMIN_EMAIL", async () => {
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
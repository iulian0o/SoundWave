import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { checkAdmin } from "./admin.controller.js";
import { clerkClient } from "@clerk/express";

vi.mock("../models/song.model.js", () => ({ Song: {} }));
vi.mock("../models/album.model.js", () => ({ Album: {} }));
vi.mock("../lib/cloudinary.js", () => ({ default: {} }));
vi.mock("@clerk/express", () => ({
  clerkClient: { users: { getUser: vi.fn() } },
}));

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe("checkAdmin", () => {
  const ORIGINAL_ADMIN_EMAIL = process.env.ADMIN_EMAIL;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_EMAIL = "admin@example.com";
  });

  afterAll(() => {
    process.env.ADMIN_EMAIL = ORIGINAL_ADMIN_EMAIL;
  });

  it("returns 401 when there is no userId", async () => {
    const req = { auth: () => ({ userId: null }) };
    const res = mockRes();
    const next = vi.fn();

    await checkAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 'admin: true' for a matching email", async () => {
    clerkClient.users.getUser.mockResolvedValueOnce({
      primaryEmailAddress: { emailAddress: "admin@example.com" },
    });
    const req = { auth: () => ({ userId: "user_123" }) };
    const res = mockRes();
    const next = vi.fn();

    await checkAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ admin: true });
  });

  it("returns { admin: false } for a non-matching email", async () => {
    clerkClient.users.getUser.mockResolvedValueOnce({
      primaryEmailAddress: { emailAddress: "nobody@example.com" },
    });
    const req = { auth: () => ({ userId: "user_456" }) };
    const res = mockRes();
    const next = vi.fn();

    await checkAdmin(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ admin: false });
  });

  it("passes the error to next() when the Clerk lookup throws", async () => {
    const clerkError = new Error("Clerk API unavailable");
    clerkClient.users.getUser.mockRejectedValueOnce(clerkError);
    const req = { auth: () => ({ userId: "user_789" }) };
    const res = mockRes();
    const next = vi.fn();

    await checkAdmin(req, res, next);

    expect(next).toHaveBeenCalledWith(clerkError);
  });
});
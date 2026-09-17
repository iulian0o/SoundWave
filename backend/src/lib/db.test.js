import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import mongoose from "mongoose";
import { connectDB } from "./db.js";

vi.mock("mongoose", () => ({
  default: {
    connect: vi.fn(),
  },
}));

describe("connectDB", () => {
  let exitSpy;
  let logSpy;

  beforeEach(() => {
    exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {});
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("connects successfully and logs the host", async () => {
    mongoose.connect.mockResolvedValueOnce({
      connection: { host: "localhost" },
    });

    await connectDB();

    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGODB_URI);
    expect(logSpy).toHaveBeenCalledWith("Connected to database localhost");
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it("exits the process when connection fails", async () => {
    const fakeError = new Error("connection refused");
    mongoose.connect.mockRejectedValueOnce(fakeError);

    await connectDB();

    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
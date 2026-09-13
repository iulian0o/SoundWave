import { describe, it, expect, vi, beforeEach } from "vitest";
import { useChatStore } from "./useChatStore.ts";
import { axiosInstance } from "../lib/axios.ts";

vi.mock("../lib/axios.ts", () => ({
  axiosInstance: { get: vi.fn() }
}));

beforeEach(() => {
  vi.clearAllMocks();
  useChatStore.setState({ users: [], isLoading: false, error: null });
});

describe("useChatStore", () => {
  it("populates users on a successful fetch", async () => {
    const users = [{ _id: "1", fullName: "iulian" }];
    vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data: users });

    await useChatStore.getState().fetchUsers();

    expect(axiosInstance.get).toHaveBeenCalledWith("/users");
    expect(useChatStore.getState().users).toEqual(users);
  });

  it("records the server's error message on a rejected response", async () => {
    vi.mocked(axiosInstance.get).mockRejectedValueOnce({
      response: { data: { message: "Failed to load users" } },
    });

    await useChatStore.getState().fetchUsers();

    expect(useChatStore.getState().error).toBe("Failed to load users");
  });

  it("throws on a response-less network error, same pattern as the other stores", async () => {
    vi.mocked(axiosInstance.get).mockRejectedValueOnce(new Error("Network Error"));

    await expect(useChatStore.getState().fetchUsers()).rejects.toThrow();
  });
});
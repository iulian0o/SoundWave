import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuthStore } from "./useAuthStore";
import { axiosInstance } from "../lib/axios";

vi.mock("../lib/axios.ts", () => ({
  axiosInstance: { get: vi.fn() },
}));

const INITIAL_STATE = { isAdmin: false, isLoading: false, error: null };

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState(INITIAL_STATE);
});

describe("useAuthStore", () => {
  it("sets admin true whent the server confirms admin status", async () => {
    vi.mocked(axiosInstance.get).mockResolvedValueOnce({
      data: { admin: true },
    });

    await useAuthStore.getState().checkAdminStatus();

    expect(axiosInstance.get).toHaveBeenCalledWith("/admin/check");
    expect(useAuthStore.getState().isAdmin).toBe(true);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it("sets isAdmin false and records the message on a rejected response", async () => {
    vi.mocked(axiosInstance.get).mockRejectedValueOnce({
      response: { data: { message: "Unauthorized, you must be an admin" } },
    });

    await useAuthStore.getState().checkAdminStatus();

    const state = useAuthStore.getState();
    expect(state.isAdmin).toBe(false);
    expect(state.error).toBe("Unauthorized, you must be an admin");
    expect(state.isLoading).toBe(false);
  });
});

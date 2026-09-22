import { describe, it, expect, vi, beforeEach } from "vitest";
import { useChatStore } from "./useChatStore.ts";
import { axiosInstance } from "../lib/axios.ts";

const { mockSocket } = vi.hoisted(() => ({
  mockSocket: {
    auth: {} as Record<string, unknown>,
    connect: vi.fn(),
    disconnect: vi.fn(),
    emit: vi.fn(),
    on: vi.fn(),
  },
}));

vi.mock("socket.io-client", () => ({
  io: vi.fn(() => mockSocket),
}));

vi.mock("../lib/axios.ts", () => ({
  axiosInstance: { get: vi.fn() },
}));

const resetStore = () => {
  useChatStore.setState({
    users: [],
    isLoading: false,
    error: null,
    socket: null,
    isConnected: false,
    onlineUsers: new Set(),
    userActivities: new Map(),
    messages: [],
    selectedUser: null,
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  resetStore();
});

describe("useChatStore", () => {
  describe("fetchUsers", () => {
    it("populates users on a succesful fetch", async () => {
      const users = [{ _id: "1", fullName: "Iulian" }];
      vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data: users });

      await useChatStore.getState().fetchUsers();

      expect(axiosInstance.get).toHaveBeenCalledWith("/users");
      expect(useChatStore.getState().users).toEqual(users);
      expect(useChatStore.getState().isLoading).toBe(false);
    });

    it("records the server's error message on a rejected response", async () => {
      vi.mocked(axiosInstance.get).mockRejectedValueOnce({
        response: { data: { message: "Failed to load users" } },
      });

      await useChatStore.getState().fetchUsers();

      expect(useChatStore.getState().error).toBe("Failed to load users");
      expect(useChatStore.getState().isLoading).toBe(false);
    });

    it("throws on a responseless network error, same pattern as the other stores", async () => {
      vi.mocked(axiosInstance.get).mockRejectedValueOnce(
        new Error("Network Error"),
      );

      await expect(useChatStore.getState().fetchUsers()).rejects.toThrow();
    });
  });

  describe("fetchMessages", () => {
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
      vi.mocked(axiosInstance.get).mockRejectedValueOnce(
        new Error("Network Error"),
      );

      await expect(useChatStore.getState().fetchUsers()).rejects.toThrow();
    });
  });

  describe("setSelectedUser", () => {
    it("stores the selected user", () => {
      const user = { _id: "1", fullname: "Iulian" };
      useChatStore.getState().setSelectedUser(user as any);

      expect(useChatStore.getState().selectedUser).toEqual(user);
    });

    it("clears the selected user when passed null", () => {
      useChatStore.setState({
        selectedUser: { _id: "1", fullName: "Iulian" } as any,
      });
      useChatStore.getState().setSelectedUser(null);

      expect(useChatStore.getState().selectedUser).toBeNull();
    });
  });

  describe("initSocket", () => {
    it("connects, authenticates, and registers listeners when not already connected", () => {
      useChatStore.getState().initSocket("user-1");

      expect(mockSocket.auth).toEqual({ userId: "user-1" });
      expect(mockSocket.connect).toHaveBeenCalledTimes(1);
      expect(mockSocket.emit).toHaveBeenCalledWith("user_connected", "user-1");
      expect(mockSocket.on).toHaveBeenCalledWith(
        "users_online",
        expect.any(Function),
      );
      expect(mockSocket.on).toHaveBeenCalledWith(
        "activities",
        expect.any(Function),
      );
      expect(mockSocket.on).toHaveBeenCalledWith(
        "user_connected",
        expect.any(Function),
      );
      expect(mockSocket.on).toHaveBeenCalledWith(
        "user_disconnected",
        expect.any(Function),
      );
      expect(mockSocket.on).toHaveBeenCalledWith(
        "receive_message",
        expect.any(Function),
      );
      expect(mockSocket.on).toHaveBeenCalledWith(
        "message_sent",
        expect.any(Function),
      );
      expect(mockSocket.on).toHaveBeenCalledWith(
        "user_activities",
        expect.any(Function),
      );
      expect(useChatStore.getState().isConnected).toBe(true);
    });

    it("does nothing when a connection is already established", () => {
      useChatStore.setState({ isConnected: true });

      useChatStore.getState().initSocket("user-1");

      expect(mockSocket.connect).not.toHaveBeenCalled();
      expect(mockSocket.emit).not.toHaveBeenCalled();
    });

    it("adds a user to onlineUsers when 'users_online' fires", () => {
      useChatStore.getState().initSocket("user-1");

      const handler = vi
        .mocked(mockSocket.on)
        .mock.calls.find(([event]) => event === "users_online")?.[1];

      handler?.(["a", "b"]);

      expect(useChatStore.getState().onlineUsers).toEqual(new Set(["a", "b"]));
    });

    it("removes a user from onlineUsers on 'user_disconnected'", () => {
      useChatStore.getState().initSocket("user-1");
      useChatStore.setState({ onlineUsers: new Set(["a", "b"]) });

      const handler = vi
        .mocked(mockSocket.on)
        .mock.calls.find(([event]) => event === "user_disconnected")?.[1];

      handler?.("a");

      expect(useChatStore.getState().onlineUsers).toEqual(new Set(["b"]));
    });

    it("appends incoming messages from 'receive_message'", () => {
      useChatStore.getState().initSocket("user-1");

      const handler = vi
        .mocked(mockSocket.on)
        .mock.calls.find(([event]) => event === "receive_message")?.[1];

      const message = { _id: "m1", content: "hey" };
      handler?.(message);

      expect(useChatStore.getState().messages).toEqual([message]);
    });

    it("tracks per-user activity from 'user_activities'", () => {
      useChatStore.getState().initSocket("user-1");

      const handler = vi
        .mocked(mockSocket.on)
        .mock.calls.find(([event]) => event === "user_activities")?.[1];

      handler?.({ userId: "a", activity: "Listening to Song X" });

      expect(useChatStore.getState().userActivities.get("a")).toBe(
        "Listening to Song X",
      );
    });
  });

  describe("sendMessage", () => {
    it("emits 'send_message' with the given payload when a socket is present on state", () => {
      useChatStore.setState({ socket: mockSocket as any });

      useChatStore.getState().sendMessage("receiver-1", "sender-1", "hello");

      expect(mockSocket.emit).toHaveBeenCalledWith("send_message", {
        receiverId: "receiver-1",
        senderId: "sender-1",
        content: "hello",
      });
    });

    it("does nothing when no socket is set on the store", () => {
      useChatStore.getState().sendMessage("receiver-1", "sender-1", "hello");

      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });
});

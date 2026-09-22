import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createServer } from "http";
import { io as ioClient } from "socket.io-client";
import { initializeSocket } from "./socket.js";
import { Message } from "../models/message.model.js";

vi.mock("../models/message.model.js", () => ({
  Message: { create: vi.fn() },
}));

let httpServer;
let io;
let port;

const connectClient = () =>
  new Promise((resolve, reject) => {
    const client = ioClient(`http://localhost:${port}`, {
      forceNew: true,
      reconnection: false,
    });
    client.once("connect", () => resolve(client));
    client.once("connect_error", reject);
  });

const waitFor = (socket, event) =>
  new Promise((resolve) => socket.once(event, resolve));

beforeEach(async () => {
  vi.clearAllMocks();
  httpServer = createServer();
  io = initializeSocket(httpServer);

  await new Promise((resolve) => {
    httpServer.listen(0, () => {
      port = httpServer.address().port;
      resolve();
    });
  });
});

afterEach(async () => {
  io.close();
  await new Promise((resolve) => httpServer.close(resolve));
});

describe("initializeSocket", () => {
  it("broadcasts presence and idle activity when a user connects", async () => {
    const client = await connectClient();

    const onlineUsersPromise = waitFor(client, "users_online");
    const connectedEventPromise = waitFor(client, "user_connected");
    const activitiesPromise = waitFor(client, "activities");
    client.emit("user_connected", "user-1");

    await expect(onlineUsersPromise).resolves.toEqual(["user-1"]);
    await expect(connectedEventPromise).resolves.toBe("user-1");
    await expect(activitiesPromise).resolves.toEqual([["user-1", "Idle"]]);

    client.disconnect();
  });

  it("broadcasts activity updates to all connected clients", async () => {
    const client = await connectClient();
    client.emit("user_connected", "user-1");
    await waitFor(client, "users_online");

    const activityPromise = waitFor(client, "user_activities");
    client.emit("update_activity", { userId: "user-1", activity: "Listening to Song X" });

    await expect(activityPromise).resolves.toEqual({
      userId: "user-1",
      activity: "Listening to Song X",
    });

    client.disconnect();
  });

  it("persists a message and echoes it back to the sender", async () => {
    const savedMessage = { _id: "m1", senderId: "user-1", receiverId: "user-2", content: "hi" };
    vi.mocked(Message.create).mockResolvedValueOnce(savedMessage);

    const client = await connectClient();
    client.emit("user_connected", "user-1");
    await waitFor(client, "users_online");

    const sentPromise = waitFor(client, "message_sent");
    client.emit("send_message", { senderId: "user-1", receiverId: "user-2", content: "hi" });

    await expect(sentPromise).resolves.toEqual(savedMessage);
    expect(Message.create).toHaveBeenCalledWith({
      senderId: "user-1",
      receiverId: "user-2",
      content: "hi",
    });

    client.disconnect();
  });

  it("delivers a message to the receiver when they're online", async () => {
    const savedMessage = { _id: "m1", senderId: "user-1", receiverId: "user-2", content: "hi" };
    vi.mocked(Message.create).mockResolvedValueOnce(savedMessage);

    const sender = await connectClient();
    const receiver = await connectClient();

    sender.emit("user_connected", "user-1");
    await waitFor(sender, "users_online");
    receiver.emit("user_connected", "user-2");
    await waitFor(receiver, "users_online");

    const receivedPromise = waitFor(receiver, "receive_message");
    sender.emit("send_message", { senderId: "user-1", receiverId: "user-2", content: "hi" });

    await expect(receivedPromise).resolves.toEqual(savedMessage);

    sender.disconnect();
    receiver.disconnect();
  });

  it("does not deliver to a receiver who isn't online", async () => {
    const savedMessage = { _id: "m1", senderId: "user-1", receiverId: "user-2", content: "hi" };
    vi.mocked(Message.create).mockResolvedValueOnce(savedMessage);

    const sender = await connectClient();
    sender.emit("user_connected", "user-1");
    await waitFor(sender, "users_online");

    const sentPromise = waitFor(sender, "message_sent");
    sender.emit("send_message", { senderId: "user-1", receiverId: "user-2", content: "hi" });

    // Only the sender-facing event should resolve; there's no receiver socket
    // registered, so io.to(receiverSocketId) has nothing to deliver to.
    await expect(sentPromise).resolves.toEqual(savedMessage);

    sender.disconnect();
  });

  it("emits message_error when saving the message fails", async () => {
    vi.mocked(Message.create).mockRejectedValueOnce(new Error("DB down"));

    const client = await connectClient();
    client.emit("user_connected", "user-1");
    await waitFor(client, "users_online");

    const errorPromise = waitFor(client, "message_error");
    client.emit("send_message", { senderId: "user-1", receiverId: "user-2", content: "hi" });

    await expect(errorPromise).resolves.toBe("DB down");

    client.disconnect();
  });

  it("removes a user from presence and notifies others on disconnect", async () => {
    const clientA = await connectClient();
    const clientB = await connectClient();

    clientA.emit("user_connected", "user-1");
    await waitFor(clientA, "users_online");
    clientB.emit("user_connected", "user-2");
    await waitFor(clientB, "users_online");

    const disconnectedPromise = waitFor(clientB, "user_disconnected");
    clientA.disconnect();

    await expect(disconnectedPromise).resolves.toBe("user-1");

    clientB.disconnect();
  });

  it("stops tracking a disconnected user's presence", async () => {
    const clientA = await connectClient();
    clientA.emit("user_connected", "user-1");
    await waitFor(clientA, "users_online");
    clientA.disconnect();

    await new Promise((resolve) => setTimeout(resolve, 50));

    const clientB = await connectClient();
    const onlineUsersPromise = waitFor(clientB, "users_online");
    clientB.emit("user_connected", "user-2");

    await expect(onlineUsersPromise).resolves.toEqual(["user-2"]);

    clientB.disconnect();
  });
});
import dotenv from "dotenv";
import mongoose from "mongoose";
import { Message } from "../models/message.model.js";
import { Song } from "../models/song.model.js";
import { Server } from "socket.io";
import { checkShareLimit, isDuplicateShare } from "./rateLimit.js";
import { verifyToken } from "@clerk/backend";

dotenv.config();

export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) throw new Error("No token");

      const payload = await verifyToken(token);

      socket.data.userId = payload.sub;

      next();
    } catch (error) {
      next(new Error("Unauthorized"));
    }
  })

  const userSockets = new Map();
  const userActivities = new Map();

  io.on("connection", (socket) => {
    socket.on("user_connected", () => {
      const userId = socket.data.userId;

      userSockets.set(userId, socket.id);
      userActivities.set(userId, "Idle");

      io.emit("user_connected", userId);
      socket.emit("users_online", Array.from(userSockets.keys()));
      io.emit("activities", Array.from(userActivities.entries()));
    });

    socket.on("update_activity", ({ activity }) => {
      const userId = socket.data.userId;

      userActivities.set(userId, activity);
      io.emit("user_activities", { userId, activity });
    });

    socket.on("send_message", async (data) => {
      try {
        const senderId = socket.data.userId; 
        if (!senderId) throw new Error("Not connected");

        const { receiverId, songId } = data;
        const content = (data.content ?? "").toString().trim().slice(0, 500);

        if (!receiverId || receiverId === senderId)
          throw new Error("Invalid receiver");

        let type = "text";
        if (songId) {
          type = "song";

          if (!mongoose.isValidObjectId(songId))
            throw new Error("Invalid song");

          const limit = await checkShareLimit(senderId);
          if (!limit.allowed) {
            throw new Error(
              `Too many shares. Try again in ${limit.retryAfter}s`,
            );
          }

          if (await isDuplicateShare(senderId, receiverId, songId)) {
            throw new Error("You just sent this song to this friend");
          }

          const exists = await Song.exists({ _id: songId });
          if (!exists) throw new Error("Song not found");
        }

        const message = await Message.create({
          senderId,
          receiverId,
          type,
          content,
          song: type === "song" ? songId : null,
        });
        if (type === "song") await message.populate("song");

        const receiverSocketId = userSockets.get(receiverId);
        if (receiverSocketId)
          io.to(receiverSocketId).emit("receive_message", message);
        socket.emit("message_sent", message);
      } catch (error) {
        console.error("Message error:", error);
        socket.emit("message_error", error.message);
      }
    });
    socket.on("disconnect", () => {
      let disconnectedUserId;
      for (const [userId, socketId] of userSockets.entries()) {
        if (socketId === socket.id) {
          disconnectedUserId = userId;
          userSockets.delete(userId);
          userActivities.delete(userId);
          break;
        }
      }
      if (disconnectedUserId) io.emit("user_disconnected", disconnectedUserId);
    });
  });

  return io;
};

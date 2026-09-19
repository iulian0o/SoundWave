import dotenv from 'dotenv';

import { Server } from "socket.io";
import { Message } from "../models/message.model";

dotenv.config();

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    }
  });

  const userSockets = new Map();
  const userActivities = new Map();

  io.on("connected", (socket) => {
    socket.on("user_connected", (userId) => {
      userSockets.set(userId, socket.id);
      userActivities.set(userId, "Idle");

      // broadcast to all connected sockets that this user just logged in
      io.emit("user_connected", userId);
      socket.emit("users_online", Array.from(userSockets.keys()));
      io.emit("activities", Array.from(userActivities.entries()));
    })

    socket.om("update_activity", ({ userId, activity }) => {
      console.log("activity updated", userId, activity);

      userActivities.set(userId, activity);

      io.emit("activity_updated", { userId, activity });
    })

    socket.on("send_message", async (data) => {
      try {
        const { serverId, receiverId, content } = data;

        const message = await Message.create({
          senderId,
          receiverId,
          content
        })

        // send to receiver in real time if they are online
        const receiverSocketId = userSockets.get(receiverId);

        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receive_message", message);
        }

        socket.emit("message_sent", message);
      } catch (error) {
        console.error("Message error:", error);
        socket.emit("message_error", error.message);
      }
    })

    socket.on("disconnect", () => {
      let disconnectedUserId;

      for (const [userId, socketId] of userSockets.entries()) {
        if (socketId == socket.id) {
          disconnectedUserId = userId;
          userSockets.delete(userId);
          userActivities.delete(userId);
          break;
        }
      }

      if (disconnectedUserId) {
        io.emit("user_disconnected", disconnectedUserId);
      }
    })
  });
}
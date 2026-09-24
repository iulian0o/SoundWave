import { create } from "zustand";
import { io } from "socket.io-client";
import { axiosInstance } from "../lib/axios.ts";
import type { Message, User } from "../types/index.ts";

interface ChatStore {
  users: User[];
  isLoading: boolean;
  error: string | null;
  socket: any;
  isConnected: boolean;
  onlineUsers: Set<string>;
  userActivities: Map<string, string>;
  messages: Message[];
  selectedUser: User | null;

  fetchUsers: () => Promise<void>;
  initSocket: (userId: string) => void;
  disconnectedSocket: () => void;
  sendMessage: (receiverId: string, senderId: string, content: string) => void;
  fetchMessages: (userId: string) => Promise<void>;
  setSelectedUser: (user: User | null) => void;
}

const baseURL = "http://localhost:5000";

const socket = io(baseURL, {
  autoConnect: false, // -> only connect is user is connected
  withCredentials: true,
});

export const useChatStore = create<ChatStore>((set, get) => ({
  users: [],
  isLoading: false,
  error: null,
  socket: socket,
  isConnected: false,
  onlineUsers: new Set(),
  userActivities: new Map(),
  messages: [],
  selectedUser: null,

  setSelectedUser: (user) => set({ selectedUser: user }),

  fetchUsers: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await axiosInstance.get("/users");
      set({ users: response.data });
    } catch (error: any) {
      set({ error: error.response.data.message });
    } finally {
      set({ isLoading: false });
    }
  },

initSocket: (userId) => {
  if (get().isConnected) return;

  socket.auth = { userId };
  socket.off(); 

  socket.on("connect", () => {
    socket.emit("user_connected", userId);
  });

  socket.on("users_online", (users: string[]) => {
    set({ onlineUsers: new Set(users) });
  });

  socket.on("activities", (activities: [string, string][]) => {
    set({ userActivities: new Map(activities) });
  });

  socket.on("user_connected", (id: string) => {
    set((state) => ({ onlineUsers: new Set([...state.onlineUsers, id]) }));
  });

  socket.on("user_disconnected", (id: string) => {
    set((state) => {
      const next = new Set(state.onlineUsers);
      next.delete(id);
      return { onlineUsers: next };
    });
  });

  socket.on("receive_message", (message: Message) => {
    if (message.senderId !== get().selectedUser?.clerkId) return;
    set((state) => ({ messages: [...state.messages, message] }));
  });

  socket.on("message_sent", (message: Message) => {
    set((state) => ({ messages: [...state.messages, message] }));
  });

  socket.on("user_activities", ({ userId, activity }) => {
    set((state) => {
      const next = new Map(state.userActivities);
      next.set(userId, activity);
      return { userActivities: next };
    });
  });

  socket.connect();
  set({ isConnected: true });
},

  disconnectedSocket: () => {
    if (get().isConnected) {
      socket.disconnect();
      set({ isConnected: false });
    }
  },

  sendMessage: async (receiverId, senderId, content) => {
    const socket = get().socket;

    if (!socket) return;

    socket.emit("send_message", { receiverId, senderId, content});
  },

  fetchMessages: async (userId: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await axiosInstance.get(`/users/messages/${userId}`);
      set({ messages: response.data });
    } catch (error: any) {
      set({ error: error.response.data.message });
    } finally {
      set({ isLoading: false });
    }
  }
}));
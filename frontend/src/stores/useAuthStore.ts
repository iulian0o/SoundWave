import toast from "react-hot-toast";
import { create } from "zustand";
import { axiosInstance } from "../lib/axios.ts";
import type { AdminRequest } from "@/types";

interface AuthStore {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  error: string | null;

  // the current user's own request
  adminRequest: AdminRequest | null;
  isRequestLoading: boolean;
  isSubmitting: boolean;

  // super admin: review list
  pendingRequests: AdminRequest[];
  isReviewLoading: boolean;

  checkAdminStatus: () => Promise<void>;
  fetchAdminRequest: () => Promise<void>;
  submitAdminRequest: (reason: string) => Promise<boolean>;
  fetchPendingRequests: () => Promise<void>;
  reviewRequest: (id: string, action: "approve" | "reject") => Promise<void>;
  reset: () => void;
}

const initialState = {
  isAdmin: false,
  isSuperAdmin: false,
  isLoading: false,
  error: null,
  adminRequest: null,
  isRequestLoading: false,
  isSubmitting: false,
  pendingRequests: [],
  isReviewLoading: false,
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  ...initialState,

  checkAdminStatus: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await axiosInstance.get("/admin/check");
      set({
        isAdmin: response.data.admin,
        isSuperAdmin: response.data.superAdmin ?? false,
      });
    } catch (error: any) {
      set({
        isAdmin: false,
        isSuperAdmin: false,
        error: error.response?.data?.message ?? error.message,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAdminRequest: async () => {
    set({ isRequestLoading: true });

    try {
      const response = await axiosInstance.get("/admin-requests/me");
      set({ adminRequest: response.data });

      if (response.data?.status === "approved" && !get().isAdmin) {
        await get().checkAdminStatus();
      }
    } catch (error: any) {
      console.error("Failed to fetch admin request", error);
    } finally {
      set({ isRequestLoading: false });
    }
  },

  submitAdminRequest: async (reason) => {
    set({ isSubmitting: true });

    try {
      const response = await axiosInstance.post("/admin-requests", { reason });
      set({ adminRequest: response.data });
      toast.success("Request sent");
      
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? "Failed to send request");
      if (error.response?.status === 409) await get().fetchAdminRequest();
      
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },

  fetchPendingRequests: async () => {
    set({ isReviewLoading: true });

    try {
      const response = await axiosInstance.get("/admin-requests", {
        params: { status: "pending" },
      });
      set({ pendingRequests: response.data });
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? "Failed to load requests");
    } finally {
      set({ isReviewLoading: false });
    }
  },

  reviewRequest: async (id, action) => {
    try {
      await axiosInstance.patch(`/admin-requests/${id}/${action}`);
      set((state) => ({
        pendingRequests: state.pendingRequests.filter((r) => r._id !== id),
      }));
      
      toast.success(action === "approve" ? "Request approved" : "Request rejected");
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? "Failed to review request");
      await get().fetchPendingRequests(); 
    }
  },

  reset: () => {
    set({ ...initialState });
  },
}));
import { useAuth } from "@clerk/react";
import { useEffect, useRef, useState } from "react";
import { Loader } from "lucide-react";
import { axiosInstance } from "../lib/axios.ts";
import { useAuthStore } from "../stores/useAuthStore";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const { checkAdminStatus, reset } = useAuthStore();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // ref to get token so the interceptors that is registered once never calls a stale closure ot it
  const getTokenRef = useRef(getToken);
  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  // register request, response interceptors once, eject both on unmount
  useEffect(() => {
    const requestInterceptorId = axiosInstance.interceptors.request.use(
      async (config) => {
        try {
          const token = await getTokenRef.current();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          } else {
            delete config.headers.Authorization;
          }
        } catch (error) {
          console.log("Error fetching token in interceptor", error);
          delete config.headers.Authorization;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptorId = axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const token = await getTokenRef.current();
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return axiosInstance(originalRequest);
            }
          } catch (retryError) {
            return Promise.reject(retryError);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axiosInstance.interceptors.request.eject(requestInterceptorId);
      axiosInstance.interceptors.response.eject(responseInterceptorId);
    };
  }, []);

  // admin check logic, decoupled from token-setting, with a race-free loading flag
  useEffect(() => {
    if (!isLoaded) return;

    const runAuthCheck = async () => {
      setIsCheckingAuth(true);

      try {
        if (isSignedIn) {
          await checkAdminStatus();
        } else {
          reset();
        }
      } catch (error) {
        console.error("Failed to verify auth status", error);
      } finally {
        setIsCheckingAuth(false);
      }
    }

    runAuthCheck();
  }, [isSignedIn, isLoaded, checkAdminStatus, reset]);

  if (!isLoaded || isCheckingAuth) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader className="size-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return <div>{children}</div>;
}
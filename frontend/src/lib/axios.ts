import axios from 'axios'

export const axiosInstance = axios.create({
  baseURL: import.meta.env.DEV ? 'http://localhost:5000/api' : "/api",
  withCredentials: true
})

let interceptorId: number | null = null;

export const setAxiosAuthToken = (getToken: () => Promise<string | null>) => {
  if (interceptorId !== null) {
    axiosInstance.interceptors.request.eject(interceptorId);
  }
  
  interceptorId = axiosInstance.interceptors.request.use(async (config) => {
    const token = await getToken();
    
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
};
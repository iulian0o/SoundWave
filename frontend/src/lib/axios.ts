import axios from 'axios'

export const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000/api'
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
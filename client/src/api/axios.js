// src/api/axios.js
import axios from 'axios';
import { getAuth, setAuth } from '../context/auth-storage';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // important: sends HttpOnly refresh cookie
  timeout: 15000,
});

// In-memory access token is stored in auth context (auth-storage)
let isRefreshing = false;
let refreshSubscribers = [];

// helper to add subscribers waiting for refresh
const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (newToken) => {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
};

// request interceptor: add Authorization header if access token present
api.interceptors.request.use((config) => {
  const auth = getAuth();
  if (auth && auth.accessToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${auth.accessToken}`;
  }
  return config;
});

// response interceptor: on 401, attempt refresh
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    // if not a 401 or if retry already attempted, reject
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // mark request as retrying to avoid loops
      originalRequest._retry = true;

      if (isRefreshing) {
        // queue the request until refresh finished
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token) => {
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }

      isRefreshing = true;

      try {
        // call refresh endpoint (cookie will be sent automatically)
        const response = await axios.post(
          `${API_BASE}/auth/refresh`,
          {},
          { withCredentials: true, timeout: 10000 }
        );

        const newAccess = response.data.accessToken;
        // update Auth storage (in-memory via setAuth)
        setAuth({ accessToken: newAccess });

        // notify queued requests
        onRefreshed(newAccess);
        isRefreshing = false;

        // retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (refreshErr) {
        isRefreshing = false;
        onRefreshed(null); // notify failure
        // Optionally clear auth
        setAuth(null);
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

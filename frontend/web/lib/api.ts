import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Enables transmitting the refresh token cookie
  headers: {
    'Content-Type': 'application/json',
  },
});

let _accessToken: string | null = null;
let _onTokenRefreshed: ((token: string) => void) | null = null;
let _onLogout: (() => void) | null = null;

// Allows Context State to update the Axios module variable
export const setAccessToken = (token: string | null) => {
  _accessToken = token;
};

// Allows Context to listen for automated token updates (from background refresh)
export const setOnTokenRefreshed = (callback: (token: string) => void) => {
  _onTokenRefreshed = callback;
};

// Allows Axios client to trigger user log out on refresh failure
export const setOnLogout = (callback: () => void) => {
  _onLogout = callback;
};

// Request Interceptor: inject current state's access token
api.interceptors.request.use(
  (config) => {
    if (_accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${_accessToken}`;
    }

    // Inject guest session ID if stored in localStorage (safe for server-side rendering check)
    if (typeof window !== 'undefined') {
      let sessionID = localStorage.getItem('guest_session_id');
      if (!sessionID) {
        sessionID = 'guest_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('guest_session_id', sessionID);
      }
      if (config.headers) {
        config.headers['X-Session-ID'] = sessionID;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: handle 401 Unauthorized errors and trigger silent token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // 401 means expired or missing Access Token
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Prevent infinite loops if the refresh request itself fails with 401
      if (originalRequest.url === '/api/v1/users/refresh') {
        if (_onLogout) _onLogout();
        return Promise.reject(error);
      }

      // If already fetching a new token, queue other failed requests
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(api(originalRequest));
            },
            reject: (err: any) => {
              reject(err);
            },
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Request a new access token using the HttpOnly cookie 'refresh_token'
        const response = await api.post<{ access_token: string }>('/api/v1/users/refresh');
        const newAccessToken = response.data.access_token;

        // Save new access token locally in axios module and notify context
        setAccessToken(newAccessToken);
        if (_onTokenRefreshed) {
          _onTokenRefreshed(newAccessToken);
        }

        processQueue(null, newAccessToken);
        isRefreshing = false;

        // Retry the original request with the new access token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        
        // Log out user if refresh token is also invalid or expired
        if (_onLogout) {
          _onLogout();
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const chatAPI = {
  sendMessage: (data: { conversation_id?: string; message: string }) =>
    api.post<{ conversation_id: string; reply: string; title?: string }>('/api/v1/chat/send', data),

  listConversations: () =>
    api.get<Array<{ id: string; title: string; created_at: string; updated_at: string }>>('/api/v1/chat/conversations'),

  getMessages: (conversationId: string) =>
    api.get<Array<{ id: string; role: string; content: string; created_at: string }>>(`/api/v1/chat/conversations/${conversationId}`),

  deleteConversation: (conversationId: string) =>
    api.delete(`/api/v1/chat/conversations/${conversationId}`),
};

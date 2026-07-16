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
      // Do not attempt to refresh token if the original request was login or register
      if (originalRequest.url === '/api/v1/users/login' || originalRequest.url === '/api/v1/users/register') {
        return Promise.reject(error);
      }

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

// ===== Blog API =====
export const blogAPI = {
  list: () =>
    api.get<Blog[]>('/api/v1/blogs'),
  
  getBySlug: (slug: string) =>
    api.get<Blog>(`/api/v1/blogs/${slug}`),
};

// ===== Project API =====
export const projectAPI = {
  list: () =>
    api.get<Project[]>('/api/v1/projects'),
  
  getById: (id: string) =>
    api.get<Project>(`/api/v1/projects/${id}`),
};

// ===== Admin API =====
export const adminBlogAPI = {
  list: () =>
    api.get<Blog[]>('/api/v1/admin/blogs'),
  
  getById: (id: string) =>
    api.get<Blog>(`/api/v1/admin/blogs/${id}`),
  
  create: (data: { title: string; content: string; cover_image?: string; published?: boolean }) =>
    api.post<Blog>('/api/v1/admin/blogs', data),
  
  update: (id: string, data: { title?: string; content?: string; cover_image?: string; published?: boolean }) =>
    api.put<Blog>(`/api/v1/admin/blogs/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/api/v1/admin/blogs/${id}`),
  
  addImage: (blogId: string, data: { url: string; alt_text?: string }) =>
    api.post<BlogImage>(`/api/v1/admin/blogs/${blogId}/images`, data),
  
  listImages: (blogId: string) =>
    api.get<BlogImage[]>(`/api/v1/admin/blogs/${blogId}/images`),
  
  deleteImage: (imageId: string) =>
    api.delete(`/api/v1/admin/blogs/images/${imageId}`),
};

export const adminProjectAPI = {
  list: () =>
    api.get<Project[]>('/api/v1/admin/projects'),
  
  getById: (id: string) =>
    api.get<Project>(`/api/v1/admin/projects/${id}`),
  
  create: (data: { title: string; description: string; tech: string[]; status: string; cover_image?: string; sort_order?: number }) =>
    api.post<Project>('/api/v1/admin/projects', data),
  
  update: (id: string, data: { title?: string; description?: string; tech?: string[]; status?: string; cover_image?: string; sort_order?: number }) =>
    api.put<Project>(`/api/v1/admin/projects/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/api/v1/admin/projects/${id}`),
  
  addImage: (projectId: string, data: { url: string; alt_text?: string }) =>
    api.post<ProjectImage>(`/api/v1/admin/projects/${projectId}/images`, data),
  
  listImages: (projectId: string) =>
    api.get<ProjectImage[]>(`/api/v1/admin/projects/${projectId}/images`),
  
  deleteImage: (imageId: string) =>
    api.delete(`/api/v1/admin/projects/images/${imageId}`),
};

export const uploadAPI = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ url: string }>('/api/v1/admin/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  delete: (filename: string) =>
    api.delete(`/api/v1/admin/uploads/${filename}`),
};

// ===== Type Definitions =====
export interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  cover_image: string;
  author_id: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlogImage {
  id: string;
  blog_id: string;
  url: string;
  alt_text: string;
  sort_order: number;
  created_at: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  tech: string[];
  status: string;
  cover_image: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectImage {
  id: string;
  project_id: string;
  url: string;
  alt_text: string;
  sort_order: number;
  created_at: string;
}

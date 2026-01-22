import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

console.log('API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for cookie-based auth
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add error interceptor for better debugging and handling
api.interceptors.response.use(
  response => response,
  async error => {
    // Only log in development, don't use console.error to avoid Next.js error overlay
    console.log('API Error:', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
    });
    
    // Don't try to auto-refresh - let pages handle auth errors
    // Auto-refresh causes race conditions and cascading failures
    return Promise.reject(error);
  }
);

// Identity Service APIs
export const authAPI = {
  register: async (username: string, email: string, password: string) => {
    try {
      const response = await api.post('/v1/auth/register', { username, email, password });
      return response.data;
    } catch (error: any) {
      console.error('Register Error:', error);
      throw error;
    }
  },

  login: async (email: string, password: string) => {
    try {
      const response = await api.post('/v1/auth/login', { email, password });
      return response.data;
    } catch (error: any) {
      console.error('Login Error:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      const response = await api.post('/v1/auth/logout');
      return response.data;
    } catch (error: any) {
      console.error('Logout Error:', error);
      throw error;
    }
  },

  refreshToken: async () => {
    try {
      const response = await api.post('/v1/auth/refresh-token');
      return response.data;
    } catch (error: any) {
      console.error('Refresh Token Error:', error);
      throw error;
    }
  },
};

// Post Service APIs
export const postAPI = {
  createPost: async (content: string, mediaIds?: string[]) => {
    const response = await api.post('/v1/posts/create-post', { content, mediaIds });
    return response.data;
  },

  getAllPosts: async (page: number = 1, limit: number = 10) => {
    const response = await api.get(`/v1/posts/all-posts?page=${page}&limit=${limit}`);
    return response.data;
  },

  getPost: async (id: string) => {
    const response = await api.get(`/v1/posts/${id}`);
    return response.data;
  },

  deletePost: async (id: string) => {
    const response = await api.delete(`/v1/posts/delete/${id}`);
    return response.data;
  },
};

// Media Service APIs
export const mediaAPI = {
  uploadMedia: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/v1/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getUserMedia: async () => {
    const response = await api.get('/v1/media/get');
    return response.data;
  },
};

// Search Service APIs
export const searchAPI = {
  searchPosts: async (query: string, page: number = 1, limit: number = 10) => {
    const response = await api.get(`/v1/search/posts?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
    return response.data;
  },
};

export default api;

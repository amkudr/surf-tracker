import axios from 'axios';
import {
  User,
  UserCreate,
  UserLogin,
  TokenResponse,
  SpotCreate,
  SpotResponse,
  SpotReviewResponse,
  SurfSessionCreate,
  SurfSessionResponse,
  SurfboardCreate,
  SurfboardResponse,
  SurfboardUpdate
} from '../types/api';
import { getStoredToken } from './authStorage';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: async (user: UserCreate): Promise<User> => {
    const response = await api.post('/auth/register', user);
    return response.data;
  },

  login: async (credentials: UserLogin, rememberMe = false): Promise<TokenResponse> => {
    const formData = new FormData();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);
    formData.append('remember_me', rememberMe ? 'true' : 'false');

    const response = await api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Surf Sessions API
export const surfSessionsAPI = {
  getAll: async (): Promise<SurfSessionResponse[]> => {
    const response = await api.get('/surf_session/');
    return response.data;
  },

  getById: async (id: number): Promise<SurfSessionResponse> => {
    const response = await api.get(`/surf_session/${id}`);
    return response.data;
  },

  create: async (session: SurfSessionCreate): Promise<SurfSessionResponse> => {
    const response = await api.post('/surf_session/', session);
    return response.data;
  },

  update: async (id: number, session: SurfSessionCreate): Promise<SurfSessionResponse> => {
    const response = await api.put(`/surf_session/${id}`, session);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/surf_session/${id}`);
  },
};

// Surfboards API
export const surfboardsAPI = {
  getAll: async (): Promise<SurfboardResponse[]> => {
    const response = await api.get('/surfboard/');
    return response.data;
  },

  getById: async (id: number): Promise<SurfboardResponse> => {
    const response = await api.get(`/surfboard/${id}`);
    return response.data;
  },

  create: async (surfboard: SurfboardCreate): Promise<SurfboardResponse> => {
    const response = await api.post('/surfboard/', surfboard);
    return response.data;
  },

  update: async (id: number, surfboard: SurfboardUpdate): Promise<SurfboardResponse> => {
    const response = await api.put(`/surfboard/${id}`, surfboard);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/surfboard/${id}`);
  },
};

// Spots API
export const spotsAPI = {
  getAll: async (): Promise<SpotResponse[]> => {
    const response = await api.get('/spot/');
    return response.data;
  },

  getById: async (id: number): Promise<SpotResponse> => {
    const response = await api.get(`/spot/${id}`);
    return response.data;
  },

  create: async (spot: SpotCreate): Promise<SpotResponse> => {
    const response = await api.post('/spot/', spot);
    return response.data;
  },

  getReviews: async (spotId: number, limit = 50, offset = 0): Promise<SpotReviewResponse[]> => {
    const response = await api.get(`/spot/${spotId}/reviews`, {
      params: { limit, offset },
    });
    return response.data;
  },
};

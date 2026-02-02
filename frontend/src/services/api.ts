import axios from 'axios';
import {
  User,
  UserCreate,
  UserLogin,
  TokenResponse,
  SpotCreate,
  SpotResponse,
  SurfSessionCreate,
  SurfSessionResponse
} from '../types/api';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
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

  login: async (credentials: UserLogin): Promise<TokenResponse> => {
    const formData = new FormData();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);

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
};
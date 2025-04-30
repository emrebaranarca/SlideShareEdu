// api.js - API Service to handle all backend requests
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token in every request
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication services
export const authService = {
  login: async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Login failed');
    }
  }
};

// Presentation services
export const presentationService = {
  getAllPresentations: async () => {
    try {
      const response = await apiClient.get('/presentations');
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to fetch presentations');
    }
  },
  
  getPresentationById: async (id) => {
    try {
      const response = await apiClient.get(`/presentations/${id}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to fetch presentation');
    }
  },
  
  uploadPresentation: async (formData) => {
    try {
      const response = await apiClient.post('/presentations', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to upload presentation');
    }
  },
  
  updatePresentation: async (id, data) => {
    try {
      const response = await apiClient.put(`/presentations/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to update presentation');
    }
  },
  
  deletePresentation: async (id) => {
    try {
      const response = await apiClient.delete(`/presentations/${id}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to delete presentation');
    }
  }
};

// Student services
export const studentService = {
  getAllStudents: async () => {
    try {
      const response = await apiClient.get('/admin/students');
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to fetch students');
    }
  },
  
  getStudentById: async (id) => {
    try {
      const response = await apiClient.get(`/admin/student-stats/${id}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to fetch student details');
    }
  },
  
  createStudent: async (data) => {
    try {
      const response = await apiClient.post('/admin/students', data);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to create student');
    }
  }
};

// Statistics services
export const statsService = {
  getOverallStats: async () => {
    try {
      const response = await apiClient.get('/admin/stats');
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to fetch statistics');
    }
  }
};

export default {
  auth: authService,
  presentations: presentationService,
  students: studentService,
  stats: statsService
};
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Attach JWT Bearer token if present
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('vanguard_auth_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle unauthorized responses (e.g. expired token)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('vanguard_auth_token');
      localStorage.removeItem('vanguard_auth_user');
      localStorage.removeItem('vanguard_auth_workspace');
      window.dispatchEvent(new Event('vanguard-auth-expired'));
    }
    return Promise.reject(error);
  }
);

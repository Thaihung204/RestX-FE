import axios from 'axios';

// Get initial base URL based on current host
// This is called once during module initialization
const getInitialBaseUrl = (): string => {
  if (typeof window === 'undefined') {
    // Server-side: use env variable or default
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  }

  const host = window.location.host;
  const protocol = window.location.protocol;

  // Development mode: use relative path (Next.js rewrites handle it)
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return '/api';
  }

  // Production: construct API URL from current host
  // e.g., demo.restx.food -> https://demo.restx.food/api
  return `${protocol}//${host}/api`;
};

const axiosInstance = axios.create({
  baseURL: getInitialBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    'accept': '*/*',
  },
  timeout: 30000, // 30 seconds timeout
});

// Update baseURL on client-side after hydration
if (typeof window !== 'undefined') {
  axiosInstance.defaults.baseURL = getInitialBaseUrl();
}

// Allow manual override of base URL (used by TenantContext when hostname is provided)
export const setAxiosBaseUrl = (baseUrl: string) => {
  axiosInstance.defaults.baseURL = baseUrl;
};

axiosInstance.interceptors.request.use(
  (config) => {
    // Ensure we are in the browser before accessing localStorage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/refresh-token') &&
      !originalRequest.url?.includes('/login')
    ) {
      originalRequest._retry = true;
      try {
        if (typeof window === 'undefined') throw new Error('No window object');

        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token available');

        // Call refresh token API
        const response = await axiosInstance.post(`/auth/refresh-token`, { refreshToken });
        if (response.data.success) {
          const { accessToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userInfo');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

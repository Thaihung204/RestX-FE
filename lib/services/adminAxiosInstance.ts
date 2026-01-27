import axios from 'axios';

/**
 * Admin Axios Instance
 * Uses relative path '/api/admin' to leverage Next.js API Routes
 * This avoids CORS issues and allows authentication via middleware
 * All requests go through Next.js backend proxy
 */
const adminAxiosInstance = axios.create({
    baseURL: '/api/admin',
    headers: {
        'Content-Type': 'application/json',
    },
});

adminAxiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        return Promise.reject(error);
    }
);

export default adminAxiosInstance;

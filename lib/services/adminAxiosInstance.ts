import axios from 'axios';

// Admin API base URL configuration
// - Production: Always use admin.restx.food/api
// - Development (localhost): Use relative path with Next.js rewrites
const getAdminBaseUrl = (): string => {
    if (typeof window === 'undefined') {
        // Server-side: use env variable or default
        return process.env.NEXT_PUBLIC_ADMIN_API_URL || 'https://admin.restx.food/api';
    }

    const host = window.location.host;

    // Development mode: use relative path (Next.js rewrites handle it)
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
        return '/api/admin';
    }

    // Production: always call admin.restx.food/api
    return 'https://admin.restx.food/api';
};

const adminAxiosInstance = axios.create({
    baseURL: getAdminBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
});

// Update baseURL on client-side after hydration
if (typeof window !== 'undefined') {
    adminAxiosInstance.defaults.baseURL = getAdminBaseUrl();
}

adminAxiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        return Promise.reject(error);
    }
);

export default adminAxiosInstance;

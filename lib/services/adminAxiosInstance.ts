import axios from 'axios';

// Admin API base URL configuration
// - Production: Always use admin.restx.food/api
// - Development (localhost): Use relative path - Next.js rewrites handle proxy to backend
const getAdminBaseUrl = (): string => {
    if (typeof window === 'undefined') {
        // Server-side: use env variable or default
        return process.env.NEXT_PUBLIC_ADMIN_API_URL || 'https://admin.restx.food/api';
    }

    const host = window.location.host;
    const hostWithoutPort = host.includes(':') ? host.split(':')[0] : host;

    // Development mode: use relative path for ALL localhost variants
    // This avoids CORS issues between demo.localhost:3000 and localhost:3000
    // Next.js rewrites will proxy the request to the actual backend
    if (hostWithoutPort === 'localhost' ||
        hostWithoutPort === '127.0.0.1' ||
        hostWithoutPort.endsWith('.localhost')) {
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

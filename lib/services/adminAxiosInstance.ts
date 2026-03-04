import axios from 'axios';

// Admin API base URL configuration
// - Server-side: uses INTERNAL_ADMIN_API_URL for internal Docker network
// - Client-side (dev): uses relative path /api/admin - Next.js rewrites handle proxy
// - Client-side (prod): constructs admin URL from current domain dynamically
const getAdminBaseUrl = (): string => {
    if (typeof window === 'undefined') {
        // Server-side: use internal URL for Docker network communication
        return process.env.INTERNAL_ADMIN_API_URL || 'http://localhost:4999/api';
    }

    const host = window.location.host;
    const hostWithoutPort = host.includes(':') ? host.split(':')[0] : host;

    // Development mode: use relative path for ALL localhost variants
    // This avoids CORS issues between demo.localhost:3000 and localhost:3000
    // Next.js rewrites will proxy /api/admin/* to admin backend
    if (hostWithoutPort === 'localhost' ||
        hostWithoutPort === '127.0.0.1' ||
        hostWithoutPort.endsWith('.localhost')) {
        return '/api/admin';
    }

    // Production: construct admin URL dynamically from current domain
    // e.g., demo.restx.food → admin.restx.food/api
    // e.g., abc.myrestaurant.com → admin.myrestaurant.com/api
    const parts = hostWithoutPort.split('.');
    if (parts.length >= 2) {
        // Replace first part (subdomain) with 'admin'
        parts[0] = 'admin';
        const adminHost = parts.join('.');
        return `${window.location.protocol}//${adminHost}/api`;
    }

    // Fallback: use relative path and let reverse proxy handle it
    return '/api/admin';
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
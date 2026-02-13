import axios from 'axios';

// Admin API base URL configuration
// - Server-side: uses INTERNAL_ADMIN_API_URL for internal Docker network
// - Client-side: uses relative path /api/admin - Next.js rewrites handle proxy
//   This avoids CORS issues because the browser never makes cross-origin requests.
//   Next.js rewrites proxy '/api/admin/:path*' -> 'admin.restx.food/api/:path*' server-side.
const getAdminBaseUrl = (): string => {
    if (typeof window === 'undefined') {
        // Server-side: use internal URL for Docker network communication
        return process.env.INTERNAL_ADMIN_API_URL || 'http://localhost:4999/api';
    }

    // Client-side: ALWAYS use relative path through Next.js rewrites to avoid CORS
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


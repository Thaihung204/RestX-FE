import axios from 'axios';

const getAdminBaseUrl = (): string => {
    if (typeof window === 'undefined') {
        return process.env.INTERNAL_ADMIN_API_URL || 'http://localhost:4999/api';
    }

    const host = window.location.host;
    const hostWithoutPort = host.includes(':') ? host.split(':')[0] : host;

    if (hostWithoutPort === 'localhost' ||
        hostWithoutPort === '127.0.0.1' ||
        hostWithoutPort.endsWith('.localhost')) {
        return '/api';
    }

    const parts = hostWithoutPort.split('.');
    if (parts.length >= 3) {
        parts[0] = 'admin';
        const adminHost = parts.join('.');
        return `${window.location.protocol}//${adminHost}/api`;
    } else if (parts.length === 2) {
        const adminHost = `admin.${hostWithoutPort}`;
        return `${window.location.protocol}//${adminHost}/api`;
    }

    return '/api';
};

const adminAxiosInstance = axios.create({
    baseURL: getAdminBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
});

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
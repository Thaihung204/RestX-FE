import axios from 'axios';

const adminAxiosInstance = axios.create({
    // Use relative path to leverage Next.js Rewrites (avoids CORS)
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

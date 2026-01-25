import axios from 'axios';

const adminAxiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_ADMIN_API_URL || 'https://admin.restx.food/api',
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

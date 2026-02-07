import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api',
    headers: {
        'Content-Type': 'application/json',
    },
})

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        console.log('[Axios Request]', config.method?.toUpperCase(), config.url);
        console.log('[Axios Request] Token exists:', !!token);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error('[Axios Request Error]', error);
        return Promise.reject(error);
    }
)

api.interceptors.response.use(
    (response) => {
        console.log('[Axios Response]', response.status, response.config.url);
        return response;
    },
    (error) => {
        console.error('[Axios Response Error]', error.response?.status, error.config?.url);
        console.error('[Axios Response Error Data]', error.response?.data);

        // Temporalmente comentado para debug - NO auto-logout
        // if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        //     localStorage.removeItem('token');
        //     if (window.location.pathname !== '/login') {
        //         window.location.href = '/login';
        //     }
        // }

        return Promise.reject(error);
    }
)

export default api;

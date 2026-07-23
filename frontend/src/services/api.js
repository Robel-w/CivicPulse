import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({
    baseURL: `${API_BASE}/api`,
    withCredentials: true // Ensure cookies/sessions are sent
});

api.interceptors.request.use(config => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user && user.username) {
        config.params = { ...config.params, username: user.username };
    }
    return config;
});

export default api;

import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api',
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

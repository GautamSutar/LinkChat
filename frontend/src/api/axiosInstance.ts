import axios from 'axios';
import TokenService from '../service/token.service';
import config from '../config.ts';

const axiosInstance = axios.create({
    baseURL: config.API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

axiosInstance.interceptors.request.use(
    (config) => {
        const accessToken = TokenService.getAccessToken();
        if (accessToken) {
            config.headers['Authorization'] = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshToken = TokenService.getRefreshToken();
            if (refreshToken) {
                try {
                    const { data } = await axios.post(`${config.API_URL}/users/refresh/`, {
                        refresh: refreshToken,
                    });

                    TokenService.setTokens({ access: data.access, refresh: refreshToken });

                    axios.defaults.headers.common['Authorization'] = `Bearer ${data.access}`;
                    originalRequest.headers['Authorization'] = `Bearer ${data.access}`;

                    return axiosInstance(originalRequest);
                } catch (refreshError) {
                    TokenService.clearTokens();
                    window.location.href = '/login';
                    return Promise.reject(refreshError);
                }
            }
        }
        return Promise.reject(error);
    }
);



export default axiosInstance;
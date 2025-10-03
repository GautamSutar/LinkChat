import axiosInstance from './axiosInstance';

export const loginUser = async (credentials) => {
    const response = await axiosInstance.post('/users/obtainToken/', credentials);
    return response.data;
};

export const signupUser = async (userData) => {
    const response = await axiosInstance.post('/users/signup/', userData);
    return response.data;
};  
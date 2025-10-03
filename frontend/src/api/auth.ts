import axiosInstance from './axiosInstance';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface SignupData {
    username: string;
    email: string;
    password: string;
    gender: "male" | "female" | "other";
}
export const loginUser = async (credentials:LoginCredentials) => {
    const response = await axiosInstance.post('/users/obtainToken/', credentials);
    return response.data;
};

export const signupUser = async (userData:SignupData) => {
    const response = await axiosInstance.post('/users/signup/', userData);
    return response.data;
};
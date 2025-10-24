import axiosInstance from './axiosInstance';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface SignupData {
    display_name: string;
    email: string;
    password: string;
    gender: "M" | "F" | "O";
}
export const loginUser = async (credentials:LoginCredentials) => {
    const response = await axiosInstance.post('/users/login/', credentials);
    console.log("user", response.data.user);
    const user = response.data.user;
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("email", response.data.user.email);
    localStorage.setItem("display_name", response.data.user.display_name);
    return response.data;
};

export const signupUser = async (userData:SignupData) => {
    const response = await axiosInstance.post('/users/signup/', userData);
    return response.data;
};
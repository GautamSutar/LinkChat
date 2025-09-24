import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:8000/api" });

export const signup = (data) => API.post("/users/signup/", data);
export const login = (data) => API.post("/users/login/", data);

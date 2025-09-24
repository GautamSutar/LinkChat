import { createContext, useState, useEffect } from "react";
import { getToken, setToken, removeToken } from "../utils/storage";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = getToken();
    if (token) {
      setUser({ token });
    }
  }, []);

  const login = (token) => {
    setToken(token);
    setUser({ token });
  };

  const logout = () => {
    removeToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

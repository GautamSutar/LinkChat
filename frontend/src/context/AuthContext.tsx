import { createContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import TokenService from '../service/token.service';
import { loginUser, signupUser } from '../api/auth.ts';
import type { LoginCredentials } from '../api/auth.ts';
import type { SignupData } from '../api/auth.ts';
interface AuthContextType {
  user: any;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (userData: SignupData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}


const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const tokens = TokenService.getTokens();
    if (tokens) {
      try {
        const decodedUser = jwtDecode(tokens.access);
        setUser(decodedUser);
      } catch (error) {
        TokenService.clearTokens();
      }
    }
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const tokens = await loginUser(credentials);
    TokenService.setTokens(tokens);
    const decodedUser = jwtDecode(tokens.access);
    setUser(decodedUser);
    navigate('/');
  };

  const signup = async (userData: SignupData) => {
    await signupUser(userData);
    await login({ email: userData.email, password: userData.password });
  };

  const logout = () => {
    TokenService.clearTokens();
    setUser(null);
    navigate('/login');
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
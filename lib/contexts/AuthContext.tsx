"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import authService, { LoginCredentials, User } from "../services/authService";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const user = authService.getCurrentUser();
        if (user) {
          const serverUser = await authService.getCurrentUserFromServer();
          if (serverUser) {
            setUser(serverUser);
          } else {
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        authService.logout();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);


  const login = async (credentials: LoginCredentials): Promise<User> => {
    try {
      const data = await authService.login(credentials);
      setUser(data);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

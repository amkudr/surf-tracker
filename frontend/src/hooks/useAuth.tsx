import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserCreate, UserLogin } from '../types/api';
import { authAPI } from '../services/api';
import { clearToken, getStoredToken, storeToken } from '../services/authStorage';

interface AuthContextType {
  user: User | null;
  login: (credentials: UserLogin, rememberMe?: boolean) => Promise<void>;
  register: (user: UserCreate) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      // Verify token and get user info
      authAPI.getCurrentUser()
        .then(setUser)
        .catch(() => {
          clearToken();
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (credentials: UserLogin, rememberMe = false) => {
    const response = await authAPI.login(credentials, rememberMe);
    storeToken(response.access_token, rememberMe);
    const userData = await authAPI.getCurrentUser();
    setUser(userData);
  };

  const register = async (userData: UserCreate) => {
    await authAPI.register(userData);
    // After registration, automatically log in
    await login({ email: userData.email, password: userData.password }, false);
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isLoading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

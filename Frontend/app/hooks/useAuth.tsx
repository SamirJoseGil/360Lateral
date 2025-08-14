// Re-export the single hook implementation to avoid duplicated/conflicting logic
import {
  useEffect,
  createContext,
  useContext,
  ReactNode,
  useState,
} from "react";
import type { User, LoginCredentials, RegisterData } from "~/types/auth";
import { AuthService } from "~/services/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (role: string | string[]) => boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Verificar autenticación al iniciar
  useEffect(() => {
    const initAuth = async () => {
      if (typeof window === "undefined") {
        setLoading(false);
        return;
      }

      const token = localStorage.getItem("auth_token");
      if (token) {
        try {
          const currentUser = await AuthService.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          console.warn("Token inválido, limpiando sesión:", error);
          // ✅ Intentar refresh token antes de limpiar
          const newToken = await AuthService.refreshToken();
          if (newToken) {
            try {
              const currentUser = await AuthService.getCurrentUser();
              setUser(currentUser);
            } catch (refreshError) {
              console.error("Refresh también falló:", refreshError);
              await AuthService.logout();
            }
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // ✅ Auto-refresh token antes de que expire
  useEffect(() => {
    if (!user) return;

    const refreshInterval = setInterval(async () => {
      try {
        await AuthService.refreshToken();
      } catch (error) {
        console.warn("Auto-refresh falló:", error);
        // No hacer logout automático, esperar a que el usuario haga una acción
      }
    }, 14 * 60 * 1000); // Refrescar cada 14 minutos

    return () => clearInterval(refreshInterval);
  }, [user]);

  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      const response = await AuthService.login(credentials);
      setUser(response.user);
    } catch (error) {
      console.error("Error en login:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setLoading(true);
      const response = await AuthService.register(data);
      setUser(response.user);
    } catch (error) {
      console.error("Error en registro:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await AuthService.logout();
      setUser(null);
    } catch (error) {
      console.error("Error en logout:", error);
      // ✅ Limpiar estado local incluso si el logout del servidor falla
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshAuth = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error("Error refrescando auth:", error);
      setUser(null);
    }
  };

  const hasRole = (role: string | string[]): boolean => {
    if (!user) return false;
    if (typeof role === "string") {
      return user.role === role;
    }
    return role.includes(user.role);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    refreshAuth,
    isAuthenticated: !!user,
    hasRole,
    token:
      typeof window !== "undefined" ? localStorage.getItem("auth_token") : null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

import { useState, useEffect } from "react";
import type { User, LoginCredentials, RegisterData } from "~/types/auth";
import { AuthService } from "~/services/auth";

// Hook para acceder a la autenticación centralizada
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Actualiza el usuario cuando cambia el token en localStorage
  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const currentUser = await AuthService.getCurrentUser();
        setUser(currentUser);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    // Escucha cambios en el token
    const handleStorage = () => {
      fetchUser();
    };

    window.addEventListener("storage", handleStorage);
    fetchUser();

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    try {
      const response = await AuthService.login(credentials);
      setUser(response.user);
      // Notifica a otros tabs/ventanas
      window.dispatchEvent(new Event("storage"));
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setLoading(true);
    try {
      const response = await AuthService.register(data);
      setUser(response.user);
      window.dispatchEvent(new Event("storage"));
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await AuthService.logout();
      setUser(null);
      window.dispatchEvent(new Event("storage"));
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role: string | string[]) => {
    if (!user) return false;
    if (typeof role === "string") return user.role === role;
    return role.includes(user.role);
  };

  return {
    user,
    loading,
    login,
    register,
    logout,
    hasRole,
    token: typeof window !== "undefined" ? localStorage.getItem("auth_token") : null,
  };
}

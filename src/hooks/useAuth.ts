import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

interface User {
  userId: string;
  email: string;
  name?: string;
  roles?: string[];
  [key: string]: any;
}

interface LoginResponse {
  status: string;
  user: User;
  token: string;
}

interface RegisterResponse {
  status: string;
  message: string;
}

// Clase de utilidad para manejo de cookies seguras
class SecureCookies {
  static get(name: string): string | undefined {
    if (typeof document === 'undefined') return undefined;
    return document.cookie
      .split('; ')
      .find(row => row.startsWith(`${name}=`))
      ?.split('=')[1];
  }

  static set(name: string, value: string, options: { [key: string]: any } = {}): void {
    if (typeof document === 'undefined') return;
    
    const cookieOptions = {
      path: '/',
      secure: window.location.protocol === 'https:',
      sameSite: 'strict',
      ...options
    };
    
    let cookieString = `${name}=${value}`;
    
    if (cookieOptions.maxAge) cookieString += `; max-age=${cookieOptions.maxAge}`;
    if (cookieOptions.path) cookieString += `; path=${cookieOptions.path}`;
    if (cookieOptions.secure) cookieString += '; secure';
    if (cookieOptions.sameSite) cookieString += `; samesite=${cookieOptions.sameSite}`;
    
    document.cookie = cookieString;
  }

  static delete(name: string): void {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; secure; samesite=strict`;
  }
}

export const useAuth = () => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true,
    error: null
  });

  // Función para comprobar si hay sesión activa
  const checkAuth = useCallback(async (silent: boolean = true) => {
    if (typeof document === 'undefined') return;
    
    const token = SecureCookies.get('token');
    if (!token) {
      setAuth({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null
      });
      return null;
    }
    
    try {
      // Verificar que el endpoint de health esté disponible
      const isHealthy = await apiService.checkHealth();
      if (!isHealthy && !silent) {
        throw new Error('El servidor no está disponible en este momento');
      }
      
      // Verificar sesión del usuario
      const data = await apiService.get<{user: User}>('/auth/me');
      
      setAuth({
        user: data.user,
        isAuthenticated: true,
        loading: false,
        error: null
      });
      
      return data.user;
    } catch (error: any) {
      // Solo establecer error si no estamos en modo silencioso
      if (!silent) {
        setAuth(prev => ({
          ...prev,
          error: error.message || 'Error al verificar sesión'
        }));
      }
      
      // Limpiar datos de autenticación
      SecureCookies.delete('token');
      setAuth({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: silent ? null : error.message
      });
      
      return null;
    }
  }, []);

  // Verificar autenticación al montar el componente
  useEffect(() => {
    // Verificación inmediata
    checkAuth(true);
    
    // Verificar sesión periódicamente (cada 5 minutos)
    const interval = setInterval(() => {
      // Solo verificar si estamos autenticados
      if (auth.isAuthenticated) {
        checkAuth(true);
      }
    }, 5 * 60 * 1000);
    
    // Limpiar interval al desmontar
    return () => clearInterval(interval);
  }, [checkAuth, auth.isAuthenticated]);

  // Función para iniciar sesión
  const login = async (email: string, password: string): Promise<User> => {
    try {
      setAuth(prev => ({ ...prev, loading: true, error: null }));
      
      const data = await apiService.post<LoginResponse>('/auth/login', { email, password });
      
      if (data.status === 'success' && data.token) {
        // Establecer cookie segura
        SecureCookies.set('token', data.token, { 
          maxAge: 86400, // 1 día
          secure: true,
          sameSite: 'strict'
        });
        
        setAuth({
          user: data.user,
          isAuthenticated: true,
          loading: false,
          error: null
        });
        
        return data.user;
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (error: any) {
      setAuth(prev => ({ 
        ...prev, 
        loading: false,
        error: error.message || 'Error al iniciar sesión'
      }));
      throw error;
    }
  };

  // Función para cerrar sesión
  const logout = async (redirectUrl: string = '/login'): Promise<void> => {
    try {
      setAuth(prev => ({ ...prev, loading: true }));
      
      // Llamar al endpoint de logout si existe
      try {
        await apiService.post('/auth/logout');
      } catch (error) {
        // Continuar con el logout incluso si falla el backend
        console.error('Error durante logout en el servidor:', error);
      }
      
      // Limpiar datos del cliente
      SecureCookies.delete('token');
      
      setAuth({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null
      });
      
      // Redirigir
      if (typeof window !== 'undefined') {
        window.location.href = redirectUrl;
      }
    } catch (error: any) {
      console.error('Error durante logout:', error);
      
      // Asegurar que el usuario se desconecte incluso si hay error
      SecureCookies.delete('token');
      setAuth({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: error.message || 'Error durante el cierre de sesión'
      });
      
      // Redirigir de todos modos
      if (typeof window !== 'undefined') {
        window.location.href = redirectUrl;
      }
    }
  };

  // Función para registrar nuevo usuario
  const register = async (email: string, password: string, name?: string): Promise<RegisterResponse> => {
    try {
      setAuth(prev => ({ ...prev, loading: true, error: null }));
      
      const data = await apiService.post<RegisterResponse>('/auth/register', { 
        email, 
        password,
        name
      });
      
      setAuth(prev => ({ ...prev, loading: false }));
      return data;
    } catch (error: any) {
      setAuth(prev => ({ 
        ...prev, 
        loading: false,
        error: error.message || 'Error al registrar usuario'
      }));
      throw error;
    }
  };

  // Función para actualizar datos del usuario actual
  const updateProfile = async (profileData: Partial<User>): Promise<User> => {
    try {
      setAuth(prev => ({ ...prev, loading: true, error: null }));
      
      const updatedUser = await apiService.put<User>('/auth/profile', profileData);
      
      setAuth(prev => ({
        ...prev,
        user: updatedUser,
        loading: false
      }));
      
      return updatedUser;
    } catch (error: any) {
      setAuth(prev => ({ 
        ...prev, 
        loading: false,
        error: error.message || 'Error al actualizar perfil'
      }));
      throw error;
    }
  };

  // Función para solicitar cambio de contraseña
  const forgotPassword = async (email: string): Promise<void> => {
    try {
      setAuth(prev => ({ ...prev, loading: true, error: null }));
      
      await apiService.post('/auth/forgot-password', { email });
      
      setAuth(prev => ({ ...prev, loading: false }));
    } catch (error: any) {
      setAuth(prev => ({ 
        ...prev, 
        loading: false,
        error: error.message || 'Error al solicitar cambio de contraseña'
      }));
      throw error;
    }
  };

  // Función para establecer nueva contraseña
  const resetPassword = async (token: string, newPassword: string): Promise<void> => {
    try {
      setAuth(prev => ({ ...prev, loading: true, error: null }));
      
      await apiService.post('/auth/reset-password', { token, password: newPassword });
      
      setAuth(prev => ({ ...prev, loading: false }));
    } catch (error: any) {
      setAuth(prev => ({ 
        ...prev, 
        loading: false,
        error: error.message || 'Error al restablecer contraseña'
      }));
      throw error;
    }
  };

  // Función para cambiar contraseña (usuario autenticado)
  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    try {
      setAuth(prev => ({ ...prev, loading: true, error: null }));
      
      await apiService.post('/auth/change-password', { 
        currentPassword, 
        newPassword 
      });
      
      setAuth(prev => ({ ...prev, loading: false }));
    } catch (error: any) {
      setAuth(prev => ({ 
        ...prev, 
        loading: false,
        error: error.message || 'Error al cambiar contraseña'
      }));
      throw error;
    }
  };

  // Función para limpiar estado de error
  const clearError = () => {
    setAuth(prev => ({ ...prev, error: null }));
  };

  // Verificar si usuario tiene rol específico
  const hasRole = (role: string): boolean => {
    return auth.user?.roles?.includes(role) || false;
  };

  return {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    loading: auth.loading,
    error: auth.error,
    login,
    logout,
    register,
    checkAuth,
    updateProfile,
    forgotPassword,
    resetPassword,
    changePassword,
    clearError,
    hasRole
  };
};
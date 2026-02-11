/**
 * BB Maintenance - Contexto de Autenticación
 * Gestiona el estado global de autenticación y permisos de usuario
 */

'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useMutation, useLazyQuery } from '@/lib/graphql/hooks';
import { LOGIN_MUTATION, ME_QUERY } from '@/lib/graphql/queries';
import type { User, AuthContextType } from '@/lib/types';

// Crear contexto con valor por defecto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

interface LoginResponse {
  login: {
    token: string;
    user: User;
  };
}

interface MeResponse {
  me: User;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [loginMutation] = useMutation<LoginResponse, { employeeNumber: string; password: string }>(
    LOGIN_MUTATION
  );
  
  const [getMeQuery] = useLazyQuery<MeResponse>(ME_QUERY);

  // Verificar si hay un token guardado al cargar la app
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await getMeQuery();
        
        if (data?.me) {
          setUser(data.me);
        } else {
          localStorage.removeItem('auth_token');
        }
      } catch (error) {
        console.error('[v0] Error al verificar autenticación:', error);
        localStorage.removeItem('auth_token');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [getMeQuery]);

  // Función de login
  const login = useCallback(
    async (employeeNumber: string, password: string): Promise<boolean> => {
      try {
        const { data, errors } = await loginMutation({
          variables: { employeeNumber, password },
        });

        if (errors || !data?.login) {
          console.error('[v0] Error al iniciar sesión:', errors);
          return false;
        }

        const { token, user: loggedUser } = data.login;
        localStorage.setItem('auth_token', token);
        setUser(loggedUser);

        return true;
      } catch (error) {
        console.error('[v0] Error al iniciar sesión:', error);
        return false;
      }
    },
    [loginMutation]
  );

  // Función de logout
  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    setUser(null);
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook para usar el contexto de autenticación
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}

// Función auxiliar para verificar permisos
export function hasPermission(
  user: User | null,
  permission: string
): boolean {
  if (!user) return false;

  const permissions: Record<string, string[]> = {
    // Solicitante
    'ot:create': ['solicitante', 'administrador'],
    'ot:view_own': ['solicitante', 'tecnico', 'administrador'],
    
    // Técnico
    'ot:view_assigned': ['tecnico', 'administrador'],
    'ot:update_technical': ['tecnico'],
    'ot:start': ['tecnico'],
    'ot:complete': ['tecnico'],
    'shift:view_own': ['tecnico', 'administrador'],
    
    // Administrador
    'ot:view_all': ['administrador'],
    'ot:assign': ['administrador'],
    'ot:update_admin': ['administrador'],
    'ot:sign': ['administrador'],
    'ot:cancel': ['administrador'],
    'shift:manage': ['administrador'],
    'dashboard:view': ['administrador'],
    'users:view': ['administrador'],
  };

  return permissions[permission]?.includes(user.role) ?? false;
}

// Hook para verificar permisos
export function usePermission(permission: string): boolean {
  const { user } = useAuth();
  return hasPermission(user, permission);
}

'use client';

/**
 * BB Maintenance - Home Page
 * Redirige al usuario segun su rol usando React Router.
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';

function HomePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

    if (user) {
      switch (user.role) {
        case 'administrador':
          navigate('/admin/dashboard', { replace: true });
          break;
        case 'tecnico':
          navigate('/tecnico/asignaciones', { replace: true });
          break;
        case 'solicitante':
          navigate('/solicitante/mis-ordenes', { replace: true });
          break;
        default:
          navigate('/login', { replace: true });
      }
    }
  }, [user, isAuthenticated, isLoading, navigate]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
        <p className="text-muted-foreground">Redirigiendo...</p>
      </div>
    </div>
  );
}

export default HomePage;

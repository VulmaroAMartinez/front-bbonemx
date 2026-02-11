'use client';

/**
 * BB Maintenance - Navegación móvil
 * Menú lateral para dispositivos móviles
 * Preparado para React Router (sin dependencias de Next.js)
 */

import React from "react"

import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import {
  Wrench,
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  Users,
  Calendar,
  FileText,
  User,
  LogOut,
  Clock,
  CheckSquare,
  ListTodo,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

// Men��s por rol
const menusByRole: Record<string, NavItem[]> = {
  administrador: [
    { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: 'Crear OT', href: '/admin/crear-ot', icon: <PlusCircle className="h-5 w-5" /> },
    { label: 'Gestionar OTs', href: '/admin/ordenes', icon: <ClipboardList className="h-5 w-5" /> },
    { label: 'Asignar Técnicos', href: '/admin/asignar', icon: <Users className="h-5 w-5" /> },
    { label: 'Horarios', href: '/admin/horarios', icon: <Calendar className="h-5 w-5" /> },
  ],
  tecnico: [
    { label: 'Mis Asignaciones', href: '/tecnico/asignaciones', icon: <CheckSquare className="h-5 w-5" /> },
    { label: 'Pendientes', href: '/tecnico/pendientes', icon: <ListTodo className="h-5 w-5" /> },
    { label: 'Horario Semanal', href: '/tecnico/horario', icon: <Clock className="h-5 w-5" /> },
  ],
  solicitante: [
    { label: 'Crear Orden', href: '/solicitante/crear-ot', icon: <PlusCircle className="h-5 w-5" /> },
    { label: 'Mis Órdenes', href: '/solicitante/mis-ordenes', icon: <FileText className="h-5 w-5" /> },
  ],
};

interface MobileNavProps {
  onClose: () => void;
}

export function MobileNav({ onClose }: MobileNavProps) {
  // TODO: En producción, reemplazar window.location.pathname con useLocation() de react-router-dom
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const { user, logout } = useAuth();

  if (!user) return null;

  const roleMenu = menusByRole[user.role] || [];

  const handleNavigation = (href: string) => {
    // TODO: En producción, usar navigate(href) de react-router-dom
    onClose();
    window.location.href = href;
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <div className="flex flex-col h-full bg-sidebar">
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
        <button
          onClick={() => handleNavigation('/')}
          className="flex items-center gap-3 cursor-pointer"
        >
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
            <Wrench className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg text-sidebar-foreground">BB Maintenance</span>
        </button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className="py-4 px-2">
          <div className="px-3 mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Menu Principal
            </p>
          </div>
          <ul className="space-y-1">
            {roleMenu.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <li key={item.href}>
                  <button
                    onClick={() => handleNavigation(item.href)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-primary'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                    )}
                  >
                    <span className={cn(isActive ? 'text-sidebar-primary' : 'text-muted-foreground')}>
                      {item.icon}
                    </span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          <Separator className="my-4" />

          <div className="px-3 mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Cuenta
            </p>
          </div>
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => handleNavigation('/perfil')}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                  pathname === '/perfil'
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                )}
              >
                <User className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Perfil</span>
              </button>
            </li>
          </ul>
        </nav>
      </ScrollArea>

      {/* User info & logout */}
      <div className="border-t border-sidebar-border p-4">
        <div className="mb-3 px-2">
          <p className="text-sm font-medium text-sidebar-foreground">{user.name}</p>
          <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-5 w-5 mr-2" />
          Cerrar Sesion
        </Button>
      </div>
    </div>
  );
}

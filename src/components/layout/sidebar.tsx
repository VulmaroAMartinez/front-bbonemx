/**
 * BB Maintenance - Sidebar de navegación
 * Muestra opciones de menú según el rol del usuario
 * Preparado para React Router
 */

'use client';

import React from "react"

import { useState } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckSquare,
  ListTodo,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

// Menús por rol
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

// Items comunes para todos los roles
const commonItems: NavItem[] = [
  { label: 'Perfil', href: '/perfil', icon: <User className="h-5 w-5" /> },
];

export function Sidebar() {
  // TODO: En producción, reemplazar window.location.pathname con useLocation() de react-router-dom
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!user) return null;

  const roleMenu = menusByRole[user.role] || [];
  const allMenuItems = [...roleMenu, ...commonItems];

  const handleNavigation = (href: string) => {
    // TODO: En producción, usar navigate(href) de react-router-dom
    console.log('[v0] Navegando a:', href);
    window.location.href = href;
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
        <button
          onClick={() => handleNavigation('/')}
          className="flex items-center gap-3 cursor-pointer"
        >
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Wrench className="h-5 w-5 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <span className="font-bold text-lg text-sidebar-foreground whitespace-nowrap">
              BB Maintenance
            </span>
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {allMenuItems.map((item) => {
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
                  title={isCollapsed ? item.label : undefined}
                >
                  <span className={cn(isActive ? 'text-sidebar-primary' : 'text-muted-foreground')}>
                    {item.icon}
                  </span>
                  {!isCollapsed && (
                    <span className="text-sm font-medium truncate">{item.label}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User info & logout */}
      <div className="border-t border-sidebar-border p-4">
        {!isCollapsed && (
          <div className="mb-3 px-2">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user.name}
            </p>
            <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className={cn(
            'w-full text-muted-foreground hover:text-destructive',
            isCollapsed ? 'justify-center' : 'justify-start'
          )}
          title={isCollapsed ? 'Cerrar Sesión' : undefined}
        >
          <LogOut className={cn('h-5 w-5', !isCollapsed && 'mr-2')} />
          {!isCollapsed && 'Cerrar Sesión'}
        </Button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 h-6 w-6 rounded-full bg-sidebar border border-sidebar-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        aria-label={isCollapsed ? 'Expandir sidebar' : 'Contraer sidebar'}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>
    </aside>
  );
}

/**
 * BB Maintenance - Shell de la aplicación
 * Contenedor principal con sidebar y header
 */

'use client';

import React from "react"

import { Sidebar } from './sidebar';
import { Header } from './header';
import { ProtectedRoute } from '@/components/protected-route';
import type { UserRole } from '@/lib/types';

interface AppShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  allowedRoles?: UserRole[];
}

export function AppShell({ children, title, subtitle, allowedRoles }: AppShellProps) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <div className="min-h-screen bg-background">
        {/* Sidebar - hidden on mobile */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Main content */}
        <div className="md:pl-64 transition-all duration-300">
          <Header title={title} subtitle={subtitle} />
          <main className="p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

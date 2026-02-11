'use client';

import { useAuth } from '@/contexts/auth-context';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Mail, Phone, Shield, Building, LogOut, Settings } from 'lucide-react';

function getRoleLabel(role: string): string {
  switch (role) {
    case 'administrador': return 'Administrador';
    case 'tecnico': return 'Tecnico';
    case 'solicitante': return 'Solicitante';
    default: return role;
  }
}

function getRoleColor(role: string): string {
  switch (role) {
    case 'administrador': return 'bg-chart-4/20 text-chart-4 border-chart-4/30';
    case 'tecnico': return 'bg-primary/20 text-primary border-primary/30';
    case 'solicitante': return 'bg-chart-3/20 text-chart-3 border-chart-3/30';
    default: return 'bg-muted text-muted-foreground';
  }
}

export default function PerfilPage() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  if (!user) return null;

  const initials = user.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <AppShell>
      <div className="space-y-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground">Mi Perfil</h1>

        {/* Profile card */}
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 md:flex-row md:items-start">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="text-center md:text-left flex-1">
                <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
                <p className="text-muted-foreground">{user.email}</p>
                <div className="mt-2">
                  <Badge variant="outline" className={getRoleColor(user.role)}>
                    <Shield className="h-3 w-3 mr-1" />
                    {getRoleLabel(user.role)}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" />
              Informacion de la cuenta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Nombre completo</p>
                <p className="text-foreground font-medium">{user.name}</p>
              </div>
            </div>
            {user.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Correo electronico</p>
                  <p className="text-foreground font-medium">{user.email}</p>
                </div>
              </div>
            )}
            {user.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Telefono</p>
                  <p className="text-foreground font-medium">{user.phone}</p>
                </div>
              </div>
            )}
            {user.employeeNumber && (
              <div className="flex items-center gap-3 text-sm">
                <Building className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Numero de empleado</p>
                  <p className="text-foreground font-medium">{user.employeeNumber}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Rol</p>
                <p className="text-foreground font-medium capitalize">{getRoleLabel(user.role)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logout */}
        <Button
          variant="destructive"
          className="w-full gap-2"
          size="lg"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesion
        </Button>
      </div>
    </AppShell>
  );
}

/**
 * BB Maintenance - Header de la aplicación
 * Incluye título de página, búsqueda y notificaciones
 */

'use client';

import { useState } from 'react';
import { useNotifications } from '@/contexts/notification-context';
import { Bell, Menu, Check, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { MobileNav } from './mobile-nav';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Formatear fecha relativa
  function formatDate(dateStr: string): string {
    try {
      return formatDistanceToNow(new Date(dateStr), {
        addSuffix: true,
        locale: es,
      });
    } catch {
      return dateStr;
    }
  }

  // Obtener icono según tipo de notificación
  function getNotificationIcon(type: string) {
    switch (type) {
      case 'ot_created':
        return <div className="h-2 w-2 rounded-full bg-primary" />;
      case 'ot_assigned':
        return <div className="h-2 w-2 rounded-full bg-chart-3" />;
      case 'ot_status_changed':
        return <div className="h-2 w-2 rounded-full bg-chart-4" />;
      case 'ot_completed':
        return <div className="h-2 w-2 rounded-full bg-success" />;
      default:
        return <div className="h-2 w-2 rounded-full bg-muted-foreground" />;
    }
  }

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 md:px-6 bg-background/95 backdrop-blur border-b border-border">
      {/* Mobile menu button */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild className="md:hidden">
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menú</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <MobileNav onClose={() => setIsMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg md:text-xl font-semibold text-foreground truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground truncate hidden sm:block">
            {subtitle}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
              <span className="sr-only">Notificaciones</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notificaciones</span>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto py-1 px-2 text-xs text-primary"
                  onClick={markAllAsRead}
                >
                  Marcar todas como leídas
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {notifications.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground text-sm">
                No hay notificaciones
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {notifications.slice(0, 10).map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={cn(
                      'flex items-start gap-3 p-3 cursor-pointer',
                      !notification.read && 'bg-accent/50'
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="mt-1.5">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                    {notification.read && (
                      <Check className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                  </DropdownMenuItem>
                ))}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

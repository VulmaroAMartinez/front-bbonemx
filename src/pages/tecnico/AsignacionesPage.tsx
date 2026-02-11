'use client';

/**
 * BB Maintenance - Tecnico Asignaciones Page
 * Lista de ordenes asignadas al tecnico
 * Componente React puro (sin dependencias de Next.js)
 */

import { useState } from 'react';
import { useQuery } from '@/lib/graphql/hooks';
import { useAuth } from '@/contexts/auth-context';
import { GET_WORK_ORDERS } from '@/lib/graphql/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/ui/status-badge';
import { WorkOrderListSkeleton } from '@/components/ui/skeleton-loaders';
import {
  Search,
  ClipboardList,
  Clock,
  CheckCircle,
  Wrench,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import type { WorkOrder, OTStatus } from '@/lib/types';

function AsignacionesPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusTab, setStatusTab] = useState('all');

  const { data, loading, error } = useQuery<{ workOrders: WorkOrder[] }>(GET_WORK_ORDERS, {
    variables: { assignedTechnicianId: user?.id },
  });

  if (loading) return <WorkOrderListSkeleton />;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">Error al cargar asignaciones</h3>
          <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  const orders = data?.workOrders || [];
  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusTab === 'all' || order.status === statusTab;
    const matchesSearch = !searchTerm || order.folioNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || order.activityDescription?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount = orders.filter((o) => o.status === 'pendiente').length;
  const progressCount = orders.filter((o) => o.status === 'en_progreso').length;
  const completedCount = orders.filter((o) => o.status === 'completada').length;

  const handleNavigate = (href: string) => {
    window.location.href = href;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Mis Asignaciones</h1>
        <p className="text-muted-foreground">Ordenes de trabajo asignadas a ti</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6 text-center">
            <Clock className="h-6 w-6 text-warning mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">Pendientes</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6 text-center">
            <Wrench className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{progressCount}</p>
            <p className="text-xs text-muted-foreground">En Progreso</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{completedCount}</p>
            <p className="text-xs text-muted-foreground">Completadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar ordenes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={statusTab} onValueChange={setStatusTab}>
          <TabsList>
            <TabsTrigger value="all">Todas ({orders.length})</TabsTrigger>
            <TabsTrigger value="pendiente">Pendientes</TabsTrigger>
            <TabsTrigger value="en_progreso">En Progreso</TabsTrigger>
            <TabsTrigger value="completada">Completadas</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Orders */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="py-12 text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-foreground">Sin resultados</h3>
              <p className="text-sm text-muted-foreground mt-1">No se encontraron ordenes con los filtros actuales</p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.id} className="bg-card border-border hover:border-primary/50 transition-colors">
              <CardContent className="py-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-sm font-bold text-primary">{order.folioNumber}</span>
                      <StatusBadge status={order.status} />
                      {order.priority && <StatusBadge priority={order.priority} variant="priority" />}
                    </div>
                    <p className="text-sm text-foreground line-clamp-2">{order.activityDescription}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{order.area?.name || 'Sin area'}</span>
                      <span>{new Date(order.createdAt).toLocaleDateString('es-ES')}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => handleNavigate(`/tecnico/orden/${order.id}`)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Ver detalle
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default AsignacionesPage;

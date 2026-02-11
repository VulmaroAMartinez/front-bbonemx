'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@/lib/graphql/hooks';
import { useAuth } from '@/contexts/auth-context';
import { GET_WORK_ORDERS } from '@/lib/graphql/queries';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StatusBadge, PriorityBadge } from '@/components/ui/status-badge';
import { WorkOrderListSkeleton } from '@/components/ui/skeleton-loaders';
import { Search, Plus, Clock, MapPin, FileText, Filter } from 'lucide-react';
import type { WorkOrder, OTStatus } from '@/lib/types';

const STATUS_TABS: { value: OTStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'en_progreso', label: 'En progreso' },
  { value: 'completada', label: 'Completadas' },
  { value: 'cancelada', label: 'Canceladas' },
];

export default function MisOrdenesPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OTStatus | 'all'>('all');

  const { data, loading, refetch } = useQuery(GET_WORK_ORDERS, {
    variables: { requesterId: user?.id },
    skip: !user?.id,
    fetchPolicy: 'cache-and-network',
  });

  const workOrders: WorkOrder[] = data?.workOrders || [];

  const filteredOrders = useMemo(() => {
    return workOrders.filter((wo) => {
      const matchesSearch =
        !searchTerm ||
        wo.otNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wo.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || wo.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [workOrders, searchTerm, statusFilter]);

  const handleNavigate = (path: string) => {
    window.location.href = path;
  };

  if (loading) {
    return (
      <AppShell>
        <WorkOrderListSkeleton count={5} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mis Ordenes</h1>
            <p className="text-muted-foreground">{workOrders.length} orden(es) registrada(s)</p>
          </div>
          <Button className="gap-2" onClick={() => handleNavigate('/solicitante/crear-ot')}>
            <Plus className="h-4 w-4" />
            Nueva orden
          </Button>
        </div>

        {/* Filters */}
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por numero o descripcion..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {STATUS_TABS.map((tab) => (
                  <Button
                    key={tab.value}
                    variant={statusFilter === tab.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(tab.value)}
                  >
                    {tab.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders list */}
        {filteredOrders.length === 0 ? (
          <Card className="bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchTerm || statusFilter !== 'all' ? 'Sin resultados' : 'Sin ordenes'}
              </h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                {searchTerm || statusFilter !== 'all'
                  ? 'Intenta con otros filtros de busqueda.'
                  : 'Aun no has creado ordenes de trabajo.'}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button onClick={() => handleNavigate('/solicitante/crear-ot')}>
                  Crear primera orden
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <Card
                key={order.id}
                className="bg-card hover:border-primary/40 transition-colors cursor-pointer"
                onClick={() => handleNavigate(`/ordenes/${order.id}`)}
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">{order.otNumber}</span>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{order.description}</p>
                    </div>
                    <PriorityBadge priority={order.priority} />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
                    {order.area && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {order.area.name}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(order.createdAt).toLocaleDateString('es-MX')}
                    </span>
                    <Badge variant="outline" className="text-xs capitalize">{order.type}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

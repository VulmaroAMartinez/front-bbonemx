'use client';

import { useState } from 'react';
import { useQuery } from '@/lib/graphql/hooks';
import { useAuth } from '@/contexts/auth-context';
import { GET_WORK_ORDERS } from '@/lib/graphql/queries';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge, PriorityBadge } from '@/components/ui/status-badge';
import { WorkOrderListSkeleton } from '@/components/ui/skeleton-loaders';
import { Clock, MapPin, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import type { WorkOrder } from '@/lib/types';

export default function PendientesPage() {
  const { user } = useAuth();

  const { data, loading, refetch } = useQuery(GET_WORK_ORDERS, {
    variables: {
      assignedTechnicianId: user?.id,
      status: 'pendiente',
    },
    skip: !user?.id,
    fetchPolicy: 'cache-and-network',
  });

  const pendingOrders: WorkOrder[] = data?.workOrders || [];

  const handleNavigate = (path: string) => {
    window.location.href = path;
  };

  if (loading) {
    return (
      <AppShell>
        <WorkOrderListSkeleton count={3} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pendientes</h1>
            <p className="text-muted-foreground">
              {pendingOrders.length} orden(es) pendiente(s) de iniciar
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            Actualizar
          </Button>
        </div>

        {/* Empty state */}
        {pendingOrders.length === 0 && (
          <Card className="bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <CheckCircle className="h-16 w-16 text-primary mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Sin ordenes pendientes
              </h3>
              <p className="text-muted-foreground text-center max-w-md">
                No tienes ordenes de trabajo pendientes de iniciar. Las nuevas asignaciones
                apareceran aqui.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Pending orders list */}
        <div className="space-y-4">
          {pendingOrders.map((order) => (
            <Card
              key={order.id}
              className="bg-card hover:border-primary/40 transition-colors cursor-pointer"
              onClick={() => handleNavigate(`/tecnico/orden/${order.id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{order.otNumber}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{order.description}</p>
                  </div>
                  <PriorityBadge priority={order.priority} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  {order.area && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {order.area.name}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {new Date(order.createdAt).toLocaleDateString('es-MX')}
                  </span>
                  {order.priority === 'critica' && (
                    <span className="flex items-center gap-1 text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      Critica
                    </span>
                  )}
                  <StatusBadge status={order.status} />
                </div>
                <div className="mt-4 flex justify-end">
                  <Button size="sm" className="gap-2">
                    Iniciar trabajo
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

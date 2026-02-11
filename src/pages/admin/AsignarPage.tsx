'use client';

/**
 * BB Maintenance - Admin Asignar Tecnicos Page
 * Pagina para asignar tecnicos a ordenes de trabajo
 * Componente React puro (sin dependencias de Next.js)
 */

import { useState } from 'react';
import { useQuery, useMutation } from '@/lib/graphql/hooks';
import { GET_WORK_ORDERS, GET_TECHNICIANS, UPDATE_WORK_ORDER_ADMIN } from '@/lib/graphql/queries';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OrderListSkeleton } from '@/components/ui/skeleton-loaders';
import { Users, Wrench, CheckCircle, AlertTriangle, Loader2, UserPlus } from 'lucide-react';
import type { WorkOrder, User } from '@/lib/types';

function AsignarPage() {
  const { data: ordersData, loading: ordersLoading, refetch: refetchOrders } = useQuery<{
    workOrders: WorkOrder[];
  }>(GET_WORK_ORDERS);

  const { data: techData, loading: techLoading } = useQuery<{
    technicians: User[];
  }>(GET_TECHNICIANS);

  const [updateOrder, { loading: updating }] = useMutation(UPDATE_WORK_ORDER_ADMIN);
  const [selectedTech, setSelectedTech] = useState<Record<string, string>>({});
  const [assignedSuccess, setAssignedSuccess] = useState<string | null>(null);

  const unassignedOrders = ordersData?.workOrders.filter(
    (wo) => !wo.assignedTechnicianId && (wo.status === 'pendiente' || wo.status === 'en_progreso')
  ) || [];

  const assignedOrders = ordersData?.workOrders.filter(
    (wo) => wo.assignedTechnicianId && (wo.status === 'pendiente' || wo.status === 'en_progreso')
  ) || [];

  const technicians = techData?.technicians || [];

  const handleAssign = async (orderId: string) => {
    const techId = selectedTech[orderId];
    if (!techId) return;

    try {
      await updateOrder({
        variables: {
          id: orderId,
          input: {
            assignedTechnicianId: techId,
            status: 'en_progreso',
          },
        },
      });
      setAssignedSuccess(orderId);
      setTimeout(() => {
        setAssignedSuccess(null);
        refetchOrders();
      }, 1500);
    } catch {
      // Error handled silently
    }
  };

  const isLoading = ordersLoading || techLoading;

  if (isLoading) return <OrderListSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Asignar Tecnicos</h1>
        <p className="text-muted-foreground">Asigne tecnicos a ordenes pendientes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-warning/20 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{unassignedOrders.length}</p>
                <p className="text-xs text-muted-foreground">Sin asignar</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Wrench className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{assignedOrders.length}</p>
                <p className="text-xs text-muted-foreground">Asignadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{technicians.length}</p>
                <p className="text-xs text-muted-foreground">Tecnicos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unassigned Orders */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-warning" />
          Ordenes sin asignar ({unassignedOrders.length})
        </h2>
        {unassignedOrders.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="py-8 text-center">
              <CheckCircle className="h-12 w-12 text-primary mx-auto mb-3" />
              <p className="text-foreground font-medium">Todas las ordenes estan asignadas</p>
              <p className="text-sm text-muted-foreground mt-1">No hay ordenes pendientes de asignacion</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {unassignedOrders.map((order) => (
              <Card key={order.id} className="bg-card border-border">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-bold text-primary">{order.folioNumber}</span>
                    <StatusBadge status={order.status} />
                    {order.priority && <StatusBadge priority={order.priority} variant="priority" />}
                  </div>
                  <CardDescription className="text-foreground mt-1">{order.activityDescription}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <Select
                      value={selectedTech[order.id] || ''}
                      onValueChange={(val) => setSelectedTech((prev) => ({ ...prev, [order.id]: val }))}
                    >
                      <SelectTrigger className="flex-1 bg-input">
                        <SelectValue placeholder="Seleccionar tecnico..." />
                      </SelectTrigger>
                      <SelectContent>
                        {technicians.map((tech) => (
                          <SelectItem key={tech.id} value={tech.id}>
                            {tech.name} - {tech.department}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => handleAssign(order.id)}
                      disabled={!selectedTech[order.id] || updating || assignedSuccess === order.id}
                      className="shrink-0"
                    >
                      {assignedSuccess === order.id ? (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Asignado
                        </>
                      ) : updating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Asignando...
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Asignar
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Assigned Orders */}
      {assignedOrders.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            Ordenes asignadas ({assignedOrders.length})
          </h2>
          <div className="space-y-3">
            {assignedOrders.map((order) => (
              <Card key={order.id} className="bg-card border-border">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-primary">{order.folioNumber}</span>
                      <StatusBadge status={order.status} />
                      <span className="text-sm text-muted-foreground truncate max-w-[300px]">{order.activityDescription}</span>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {order.assignedTechnician?.name || 'Tecnico asignado'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AsignarPage;

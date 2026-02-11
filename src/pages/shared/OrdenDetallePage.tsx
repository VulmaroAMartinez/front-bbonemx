'use client';

import { useQuery } from '@/lib/graphql/hooks';
import { GET_WORK_ORDER } from '@/lib/graphql/queries';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge, PriorityBadge } from '@/components/ui/status-badge';
import { WorkOrderDetailSkeleton } from '@/components/ui/skeleton-loaders';
import {
  ArrowLeft, Calendar, MapPin, User, Clock, Wrench, FileText,
  CheckCircle, AlertTriangle, Package, Settings,
} from 'lucide-react';
import type { WorkOrder } from '@/lib/types';

interface OrdenDetallePageProps {
  id?: string;
}

export default function OrdenDetallePage({ id }: OrdenDetallePageProps) {
  const orderId = id || window.location.pathname.split('/').pop() || '';

  const { data, loading } = useQuery(GET_WORK_ORDER, {
    variables: { id: orderId },
    skip: !orderId,
  });

  const order: WorkOrder | null = data?.workOrder || null;

  const handleBack = () => window.history.back();

  if (loading) {
    return (
      <AppShell>
        <WorkOrderDetailSkeleton />
      </AppShell>
    );
  }

  if (!order) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-16">
          <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Orden no encontrada</h2>
          <p className="text-muted-foreground mb-4">La orden solicitada no existe o no tienes acceso.</p>
          <Button variant="outline" onClick={handleBack}>Volver</Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">{order.otNumber}</h1>
              <StatusBadge status={order.status} />
              <PriorityBadge priority={order.priority} />
            </div>
            <p className="text-muted-foreground mt-1">{order.description}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* General info */}
          <Card className="bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Informacion General
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo</span>
                <Badge variant="outline" className="capitalize">{order.type}</Badge>
              </div>
              {order.area && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Area
                  </span>
                  <span className="text-foreground">{order.area.name}</span>
                </div>
              )}
              {order.equipment && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Wrench className="h-3 w-3" /> Equipo
                  </span>
                  <span className="text-foreground">{order.equipment.name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Settings className="h-3 w-3" /> Estado
                </span>
                <StatusBadge status={order.status} />
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Linea de Tiempo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Creada
                </span>
                <span className="text-foreground">
                  {new Date(order.createdAt).toLocaleDateString('es-MX', {
                    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>
              {order.startedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Iniciada</span>
                  <span className="text-foreground">
                    {new Date(order.startedAt).toLocaleDateString('es-MX', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>
              )}
              {order.completedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-primary" /> Completada
                  </span>
                  <span className="text-foreground">
                    {new Date(order.completedAt).toLocaleDateString('es-MX', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Assigned technician */}
        {order.assignedTechnician && (
          <Card className="bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Tecnico Asignado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{order.assignedTechnician.name}</p>
                  <p className="text-sm text-muted-foreground">{order.assignedTechnician.specialty || 'Tecnico'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {order.notes && order.notes.length > 0 && (
          <Card className="bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Notas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {order.notes.map((note: { text: string; createdAt: string }, idx: number) => (
                <div key={idx} className="bg-secondary rounded-lg p-3">
                  <p className="text-sm text-foreground">{note.text}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(note.createdAt).toLocaleString('es-MX')}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Materials */}
        {order.materialsUsed && order.materialsUsed.length > 0 && (
          <Card className="bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                Materiales Utilizados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {order.materialsUsed.map((mat: { name: string; quantity: number }, idx: number) => (
                  <div key={idx} className="flex items-center justify-between bg-secondary rounded-lg px-3 py-2">
                    <span className="text-sm text-foreground">{mat.name}</span>
                    <Badge variant="outline">x{mat.quantity}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

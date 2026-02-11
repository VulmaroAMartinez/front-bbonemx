'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@/lib/graphql/hooks';
import { useAuth } from '@/contexts/auth-context';
import { GET_WORK_ORDER, UPDATE_WORK_ORDER_TECHNICIAN } from '@/lib/graphql/queries';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { StatusBadge, PriorityBadge } from '@/components/ui/status-badge';
import { WorkOrderDetailSkeleton } from '@/components/ui/skeleton-loaders';
import {
  ArrowLeft, Clock, MapPin, Wrench, FileText, CheckCircle,
  AlertTriangle, Package, Timer, Plus, Save, Play, Square,
} from 'lucide-react';
import type { WorkOrder } from '@/lib/types';

interface OrdenTecnicoPageProps {
  id?: string;
}

export default function OrdenTecnicoPage({ id }: OrdenTecnicoPageProps) {
  const orderId = id || window.location.pathname.split('/').pop() || '';
  const { user } = useAuth();
  const [notes, setNotes] = useState('');
  const [materialName, setMaterialName] = useState('');
  const [materialQty, setMaterialQty] = useState('1');
  const [isWorking, setIsWorking] = useState(false);

  const { data, loading, refetch } = useQuery(GET_WORK_ORDER, {
    variables: { id: orderId },
    skip: !orderId,
  });

  const [updateOrder, { loading: updating }] = useMutation(UPDATE_WORK_ORDER_TECHNICIAN);

  const order: WorkOrder | null = data?.workOrder || null;

  const handleBack = () => window.history.back();

  const handleStartWork = useCallback(async () => {
    if (!orderId) return;
    try {
      await updateOrder({
        variables: { id: orderId, input: { status: 'en_progreso', startedAt: new Date().toISOString() } },
      });
      setIsWorking(true);
      refetch();
    } catch (err) {
      console.error('Error starting work:', err);
    }
  }, [orderId, updateOrder, refetch]);

  const handleCompleteWork = useCallback(async () => {
    if (!orderId) return;
    try {
      await updateOrder({
        variables: { id: orderId, input: { status: 'completada', completedAt: new Date().toISOString() } },
      });
      setIsWorking(false);
      refetch();
    } catch (err) {
      console.error('Error completing work:', err);
    }
  }, [orderId, updateOrder, refetch]);

  const handleAddNote = useCallback(async () => {
    if (!orderId || !notes.trim()) return;
    try {
      await updateOrder({
        variables: {
          id: orderId,
          input: {
            notes: [...(order?.notes || []), {
              text: notes.trim(),
              createdBy: user?.id || '',
              createdAt: new Date().toISOString(),
            }],
          },
        },
      });
      setNotes('');
      refetch();
    } catch (err) {
      console.error('Error adding note:', err);
    }
  }, [orderId, notes, order, user, updateOrder, refetch]);

  const handleAddMaterial = useCallback(async () => {
    if (!orderId || !materialName.trim()) return;
    try {
      await updateOrder({
        variables: {
          id: orderId,
          input: {
            materialsUsed: [...(order?.materialsUsed || []), {
              name: materialName.trim(),
              quantity: Number(materialQty) || 1,
              addedBy: user?.id || '',
            }],
          },
        },
      });
      setMaterialName('');
      setMaterialQty('1');
      refetch();
    } catch (err) {
      console.error('Error adding material:', err);
    }
  }, [orderId, materialName, materialQty, order, user, updateOrder, refetch]);

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
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{order.otNumber}</h1>
              <StatusBadge status={order.status} />
              <PriorityBadge priority={order.priority} />
            </div>
            <p className="text-muted-foreground mt-1">{order.description}</p>
          </div>
        </div>

        {/* Action buttons */}
        {order.status === 'pendiente' && (
          <Card className="bg-card border-primary/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">Iniciar trabajo</h3>
                  <p className="text-sm text-muted-foreground">Presiona para comenzar a trabajar en esta orden</p>
                </div>
                <Button onClick={handleStartWork} disabled={updating} className="gap-2">
                  <Play className="h-4 w-4" />
                  Iniciar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {order.status === 'en_progreso' && (
          <Card className="bg-card border-chart-3/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">Trabajo en progreso</h3>
                  <p className="text-sm text-muted-foreground">Completa la orden cuando termines</p>
                </div>
                <Button variant="destructive" onClick={handleCompleteWork} disabled={updating} className="gap-2">
                  <Square className="h-4 w-4" />
                  Completar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order info */}
        <div className="grid gap-4 md:grid-cols-2">
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
                  <Clock className="h-3 w-3" /> Creada
                </span>
                <span className="text-foreground">
                  {new Date(order.createdAt).toLocaleDateString('es-MX')}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Timer card */}
          <Card className="bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Timer className="h-4 w-4 text-primary" />
                Tiempo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Inicio</span>
                <span className="text-foreground">
                  {order.startedAt ? new Date(order.startedAt).toLocaleString('es-MX') : '--'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fin</span>
                <span className="text-foreground">
                  {order.completedAt ? new Date(order.completedAt).toLocaleString('es-MX') : '--'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notes section */}
        <Card className="bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Notas de trabajo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.notes && order.notes.length > 0 && (
              <div className="space-y-2">
                {order.notes.map((note: { text: string; createdAt: string }, idx: number) => (
                  <div key={idx} className="bg-secondary rounded-lg p-3">
                    <p className="text-sm text-foreground">{note.text}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(note.createdAt).toLocaleString('es-MX')}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {(order.status === 'en_progreso' || order.status === 'pendiente') && (
              <div className="flex gap-2">
                <Textarea
                  placeholder="Agregar nota..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[60px]"
                />
                <Button size="icon" onClick={handleAddNote} disabled={!notes.trim() || updating}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Materials section */}
        <Card className="bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Materiales utilizados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.materialsUsed && order.materialsUsed.length > 0 && (
              <div className="space-y-2">
                {order.materialsUsed.map((mat: { name: string; quantity: number }, idx: number) => (
                  <div key={idx} className="flex items-center justify-between bg-secondary rounded-lg px-3 py-2">
                    <span className="text-sm text-foreground">{mat.name}</span>
                    <Badge variant="outline">x{mat.quantity}</Badge>
                  </div>
                ))}
              </div>
            )}
            {(order.status === 'en_progreso' || order.status === 'pendiente') && (
              <div className="flex gap-2">
                <Input
                  placeholder="Material..."
                  value={materialName}
                  onChange={(e) => setMaterialName(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  min="1"
                  value={materialQty}
                  onChange={(e) => setMaterialQty(e.target.value)}
                  className="w-20"
                />
                <Button size="icon" onClick={handleAddMaterial} disabled={!materialName.trim() || updating}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

'use client';

/**
 * BB Maintenance - Admin Orden Detalle Page
 * Vista de detalle de una orden de trabajo para admin
 * Componente React puro (sin dependencias de Next.js)
 */

import { useState } from 'react';
import { useQuery, useMutation, gql } from '@/lib/graphql/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/ui/status-badge';
import { WorkOrderDetailSkeleton } from '@/components/ui/skeleton-loaders';
import { useNotification } from '@/contexts/notification-context';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  Clock,
  Wrench,
  FileText,
  AlertTriangle,
  Settings,
  Package,
  Edit,
  UserPlus,
  XCircle,
} from 'lucide-react';

const GET_WORK_ORDER_ADMIN = gql`
  query GetWorkOrderAdmin($id: ID!) {
    workOrder(id: $id) {
      id
      code
      title
      description
      status
      priority
      workType
      createdAt
      scheduledDate
      startedAt
      completedAt
      estimatedHours
      actualHours
      location { id name area building }
      asset { id name code model manufacturer serialNumber }
      requestedBy { id firstName lastName email department }
      assignedTo { id firstName lastName email specialty phone }
      materials { id name quantity unit status }
      comments { id text createdAt author { firstName lastName role } }
      images
      technicianNotes
    }
    technicians { id firstName lastName specialty available }
  }
`;

const ASSIGN_TECHNICIAN = gql`
  mutation AssignTechnician($workOrderId: ID!, $technicianId: ID!) {
    assignTechnician(workOrderId: $workOrderId, technicianId: $technicianId) {
      id status assignedTo { id firstName lastName }
    }
  }
`;

const CANCEL_WORK_ORDER = gql`
  mutation CancelWorkOrder($id: ID!, $reason: String!) {
    cancelWorkOrder(id: $id, reason: $reason) { id status }
  }
`;

interface OrdenDetallePageProps {
  orderId?: string;
}

function OrdenDetallePage({ orderId }: OrdenDetallePageProps) {
  // TODO: En produccion, usar useParams() de react-router-dom
  const id = orderId || (typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : '');
  const { showNotification } = useNotification();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const { data, loading, error, refetch } = useQuery(GET_WORK_ORDER_ADMIN, {
    variables: { id },
  });

  const [assignTechnician, { loading: assigning }] = useMutation(ASSIGN_TECHNICIAN, {
    onCompleted: () => {
      showNotification('success', 'Tecnico asignado correctamente');
      setAssignDialogOpen(false);
      setSelectedTechnician('');
      refetch();
    },
    onError: (err) => showNotification('error', `Error: ${err.message}`),
  });

  const [cancelOrder, { loading: cancelling }] = useMutation(CANCEL_WORK_ORDER, {
    onCompleted: () => {
      showNotification('success', 'Orden cancelada');
      setCancelDialogOpen(false);
      refetch();
    },
    onError: (err) => showNotification('error', `Error: ${err.message}`),
  });

  if (loading) return <WorkOrderDetailSkeleton />;

  if (error || !data?.workOrder) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">Orden no encontrada</h3>
          <p className="mt-2 text-sm text-muted-foreground">{error?.message || 'La orden de trabajo no existe'}</p>
          <Button className="mt-4 bg-transparent" variant="outline" onClick={() => window.history.back()}>
            Volver
          </Button>
        </div>
      </div>
    );
  }

  const order = data.workOrder;
  const technicians = data.technicians || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button variant="ghost" className="w-fit text-muted-foreground" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a ordenes
        </Button>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{order.code}</h1>
              <StatusBadge status={order.status} />
              <StatusBadge priority={order.priority} variant="priority" />
            </div>
            <p className="mt-1 text-lg text-muted-foreground">{order.title}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {order.status !== 'COMPLETADA' && order.status !== 'CANCELADA' && (
              <>
                <Button variant="outline" onClick={() => setAssignDialogOpen(true)} className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                  <UserPlus className="mr-2 h-4 w-4" />
                  {order.assignedTo ? 'Reasignar' : 'Asignar Tecnico'}
                </Button>
                <Button variant="outline" onClick={() => setCancelDialogOpen(true)} className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancelar OT
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <FileText className="h-5 w-5" />
                Descripcion del Trabajo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground whitespace-pre-wrap">{order.description}</p>
            </CardContent>
          </Card>

          {/* Location & Asset */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <MapPin className="h-5 w-5" />
                  Ubicacion
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Area</p>
                  <p className="font-medium text-foreground">{order.location?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Zona</p>
                  <p className="text-foreground">{order.location?.area}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Edificio</p>
                  <p className="text-foreground">{order.location?.building}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Settings className="h-5 w-5" />
                  Activo/Equipo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Nombre</p>
                  <p className="font-medium text-foreground">{order.asset?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Codigo</p>
                  <p className="font-mono text-primary">{order.asset?.code}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Modelo / Fabricante</p>
                  <p className="text-foreground">{order.asset?.model} - {order.asset?.manufacturer}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Materials */}
          {order.materials && order.materials.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Package className="h-5 w-5" />
                  Materiales Requeridos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.materials.map((material: { id: string; name: string; quantity: number; unit: string; status: string }) => (
                    <div key={material.id} className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3">
                      <div>
                        <p className="font-medium text-foreground">{material.name}</p>
                        <p className="text-sm text-muted-foreground">{material.quantity} {material.unit}</p>
                      </div>
                      <StatusBadge status={material.status} variant="material" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Images */}
          {order.images && order.images.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Evidencia Fotografica</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {order.images.map((image: string, index: number) => (
                    <div key={index} className="relative aspect-video rounded-lg overflow-hidden border border-border">
                      <img src={image || '/placeholder.svg'} alt={`Evidencia ${index + 1}`} className="object-cover w-full h-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Technician Notes */}
          {order.technicianNotes && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Edit className="h-5 w-5" />
                  Notas del Tecnico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap">{order.technicianNotes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Clock className="h-5 w-5" />
                Linea de Tiempo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Creada</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString('es-ES')}</p>
                  </div>
                </div>
                {order.startedAt && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                      <Wrench className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Iniciada</p>
                      <p className="text-xs text-muted-foreground">{new Date(order.startedAt).toLocaleString('es-ES')}</p>
                    </div>
                  </div>
                )}
                {order.completedAt && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Completada</p>
                      <p className="text-xs text-muted-foreground">{new Date(order.completedAt).toLocaleString('es-ES')}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Requester */}
          {order.requestedBy && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <User className="h-5 w-5" />
                  Solicitante
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-medium text-foreground">{order.requestedBy.firstName} {order.requestedBy.lastName}</p>
                <p className="text-sm text-muted-foreground">{order.requestedBy.email}</p>
                <p className="text-sm text-muted-foreground">{order.requestedBy.department}</p>
              </CardContent>
            </Card>
          )}

          {/* Assigned Technician */}
          {order.assignedTo && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Wrench className="h-5 w-5" />
                  Tecnico Asignado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-medium text-foreground">{order.assignedTo.firstName} {order.assignedTo.lastName}</p>
                <p className="text-sm text-muted-foreground">{order.assignedTo.specialty}</p>
                <p className="text-sm text-muted-foreground">{order.assignedTo.phone}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-foreground">Asignar Tecnico</DialogTitle>
            <DialogDescription>Seleccione el tecnico para asignar a esta orden</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tecnico</Label>
              <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tecnico" />
                </SelectTrigger>
                <SelectContent>
                  {technicians.map((tech: { id: string; firstName: string; lastName: string; specialty: string; available: boolean }) => (
                    <SelectItem key={tech.id} value={tech.id} disabled={!tech.available}>
                      {tech.firstName} {tech.lastName} - {tech.specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)} className="bg-transparent">Cancelar</Button>
            <Button onClick={() => assignTechnician({ variables: { workOrderId: order.id, technicianId: selectedTechnician } })} disabled={!selectedTechnician || assigning}>
              {assigning ? 'Asignando...' : 'Asignar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-foreground">Cancelar Orden</DialogTitle>
            <DialogDescription>Indique el motivo de la cancelacion</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Escriba el motivo de cancelacion..." className="min-h-[100px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)} className="bg-transparent">Volver</Button>
            <Button variant="destructive" onClick={() => cancelOrder({ variables: { id: order.id, reason: cancelReason } })} disabled={!cancelReason.trim() || cancelling}>
              {cancelling ? 'Cancelando...' : 'Cancelar Orden'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default OrdenDetallePage;

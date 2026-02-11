'use client';

/**
 * BB Maintenance - Admin Ordenes Page
 * Lista de ordenes de trabajo con filtros y asignacion
 * Componente React puro (sin dependencias de Next.js)
 */

import { useState } from 'react';
import { useQuery, useMutation, gql } from '@/lib/graphql/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { StatusBadge } from '@/components/ui/status-badge';
import { WorkOrderListSkeleton } from '@/components/ui/skeleton-loaders';
import { useNotification } from '@/contexts/notification-context';
import {
  Search,
  Filter,
  UserPlus,
  Calendar,
  MapPin,
  AlertTriangle,
  Eye,
} from 'lucide-react';

const GET_ALL_WORK_ORDERS = gql`
  query GetAllWorkOrders($filter: WorkOrderFilterInput) {
    workOrders(filter: $filter) {
      id
      code
      title
      description
      status
      priority
      workType
      createdAt
      scheduledDate
      location {
        name
        area
      }
      asset {
        name
        code
      }
      requestedBy {
        firstName
        lastName
      }
      assignedTo {
        id
        firstName
        lastName
      }
    }
    technicians {
      id
      firstName
      lastName
      specialty
      available
    }
  }
`;

const ASSIGN_TECHNICIAN = gql`
  mutation AssignTechnician($workOrderId: ID!, $technicianId: ID!) {
    assignTechnician(workOrderId: $workOrderId, technicianId: $technicianId) {
      id
      status
      assignedTo {
        id
        firstName
        lastName
      }
    }
  }
`;

interface WorkOrder {
  id: string;
  code: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  workType: string;
  createdAt: string;
  scheduledDate?: string;
  location?: { name: string; area: string };
  asset?: { name: string; code: string };
  requestedBy?: { firstName: string; lastName: string };
  assignedTo?: { id: string; firstName: string; lastName: string };
}

function OrdenesPage() {
  // TODO: En produccion, usar useSearchParams() de react-router-dom
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const { showNotification } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(urlParams.get('status') || 'all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<{ id: string; code: string; title: string } | null>(null);
  const [selectedTechnician, setSelectedTechnician] = useState<string>('');

  const filter: { status?: string; priority?: string } = {};
  if (statusFilter !== 'all') filter.status = statusFilter;
  if (priorityFilter !== 'all') filter.priority = priorityFilter;

  const { data, loading, error, refetch } = useQuery(GET_ALL_WORK_ORDERS, {
    variables: { filter: Object.keys(filter).length > 0 ? filter : undefined },
  });

  const [assignTechnician, { loading: assigning }] = useMutation(ASSIGN_TECHNICIAN, {
    onCompleted: () => {
      showNotification('success', 'Tecnico asignado correctamente');
      setAssignDialogOpen(false);
      setSelectedOrder(null);
      setSelectedTechnician('');
      refetch();
    },
    onError: (err) => {
      showNotification('error', `Error: ${err.message}`);
    },
  });

  const handleAssign = () => {
    if (selectedOrder && selectedTechnician) {
      assignTechnician({
        variables: {
          workOrderId: selectedOrder.id,
          technicianId: selectedTechnician,
        },
      });
    }
  };

  const openAssignDialog = (order: { id: string; code: string; title: string }) => {
    setSelectedOrder(order);
    setAssignDialogOpen(true);
  };

  const handleNavigate = (href: string) => {
    // TODO: En produccion, usar navigate(href) de react-router-dom
    window.location.href = href;
  };

  if (loading) return <WorkOrderListSkeleton />;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">Error al cargar ordenes</h3>
          <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  const orders: WorkOrder[] = data?.workOrders || [];
  const technicians = data?.technicians || [];

  const filteredOrders = orders.filter((order) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      order.code?.toLowerCase().includes(term) ||
      order.title?.toLowerCase().includes(term) ||
      order.description?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Gestion de Ordenes de Trabajo
          </h1>
          <p className="text-muted-foreground">
            Administra y asigna todas las ordenes del sistema
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por codigo, titulo o descripcion..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px] bg-secondary border-border text-foreground">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                  <SelectItem value="ASIGNADA">Asignada</SelectItem>
                  <SelectItem value="EN_PROGRESO">En Progreso</SelectItem>
                  <SelectItem value="COMPLETADA">Completada</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[160px] bg-secondary border-border text-foreground">
                  <SelectValue placeholder="Prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="CRITICA">Critica</SelectItem>
                  <SelectItem value="ALTA">Alta</SelectItem>
                  <SelectItem value="MEDIA">Media</SelectItem>
                  <SelectItem value="BAJA">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">No se encontraron ordenes</h3>
              <p className="mt-2 text-sm text-muted-foreground">Intenta ajustar los filtros de busqueda</p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.id} className="bg-card border-border hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-semibold text-primary">{order.code}</span>
                    <StatusBadge status={order.status} />
                    <StatusBadge priority={order.priority} variant="priority" />
                  </div>
                  <div className="flex gap-2">
                    {(order.status === 'PENDIENTE' || order.status === 'ASIGNADA') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAssignDialog(order)}
                        className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        {order.assignedTo ? 'Reasignar' : 'Asignar'}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleNavigate(`/admin/ordenes/${order.id}`)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Ver detalle
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-lg text-foreground mb-2">{order.title}</CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{order.description}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{order.location?.name || 'Sin ubicacion'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(order.createdAt).toLocaleDateString('es-ES')}</span>
                  </div>
                  {order.assignedTo && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <UserPlus className="h-4 w-4" />
                      <span>{order.assignedTo.firstName} {order.assignedTo.lastName}</span>
                    </div>
                  )}
                  {order.requestedBy && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>Solicitante: {order.requestedBy.firstName} {order.requestedBy.lastName}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-foreground">Asignar Tecnico</DialogTitle>
            <DialogDescription>
              {selectedOrder && `Asignar tecnico a la orden ${selectedOrder.code}: ${selectedOrder.title}`}
            </DialogDescription>
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
                      {!tech.available && ' (No disponible)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)} className="bg-transparent">
              Cancelar
            </Button>
            <Button onClick={handleAssign} disabled={!selectedTechnician || assigning}>
              {assigning ? 'Asignando...' : 'Asignar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default OrdenesPage;

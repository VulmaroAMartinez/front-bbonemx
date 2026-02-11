/**
 * BB Maintenance - Badge de Estado
 * Muestra estados con colores y estilos consistentes
 */

import { cn } from '@/lib/utils';
import type { OTStatus, Priority, MaintenanceType } from '@/lib/types';

// Configuración de estados de OT
const statusConfig: Record<OTStatus, { label: string; className: string }> = {
  pendiente: {
    label: 'Pendiente',
    className: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  },
  en_progreso: {
    label: 'En Progreso',
    className: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  },
  completada: {
    label: 'Completada',
    className: 'bg-primary/10 text-primary border-primary/20',
  },
  cancelada: {
    label: 'Cancelada',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
};

// Configuración de prioridades
const priorityConfig: Record<Priority, { label: string; className: string }> = {
  alta: {
    label: 'Alta',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  media: {
    label: 'Media',
    className: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  },
  baja: {
    label: 'Baja',
    className: 'bg-primary/10 text-primary border-primary/20',
  },
};

// Configuración de tipos de mantenimiento
const maintenanceTypeConfig: Record<MaintenanceType, { label: string; className: string }> = {
  correctivo: {
    label: 'Correctivo',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  preventivo: {
    label: 'Preventivo',
    className: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  },
  predictivo: {
    label: 'Predictivo',
    className: 'bg-chart-5/10 text-chart-5 border-chart-5/20',
  },
};

interface StatusBadgeProps {
  status: OTStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium border rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        config.className
      )}
    >
      {config.label}
    </span>
  );
}

interface PriorityBadgeProps {
  priority: Priority;
  size?: 'sm' | 'md';
}

export function PriorityBadge({ priority, size = 'md' }: PriorityBadgeProps) {
  const config = priorityConfig[priority];

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium border rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        config.className
      )}
    >
      {config.label}
    </span>
  );
}

interface MaintenanceTypeBadgeProps {
  type: MaintenanceType;
  size?: 'sm' | 'md';
}

export function MaintenanceTypeBadge({ type, size = 'md' }: MaintenanceTypeBadgeProps) {
  const config = maintenanceTypeConfig[type];

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium border rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        config.className
      )}
    >
      {config.label}
    </span>
  );
}

// Función auxiliar para obtener label de estado
export function getStatusLabel(status: OTStatus): string {
  return statusConfig[status]?.label || status;
}

// Función auxiliar para obtener label de prioridad
export function getPriorityLabel(priority: Priority): string {
  return priorityConfig[priority]?.label || priority;
}

// Función auxiliar para obtener label de tipo de mantenimiento
export function getMaintenanceTypeLabel(type: MaintenanceType): string {
  return maintenanceTypeConfig[type]?.label || type;
}

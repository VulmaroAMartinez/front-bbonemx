'use client';

/**
 * BB Maintenance - Admin Dashboard Page
 * Panel de control con estadisticas generales
 * Componente React puro (sin dependencias de Next.js)
 */

import { useQuery } from '@/lib/graphql/hooks';
import { GET_DASHBOARD_STATS } from '@/lib/graphql/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardSkeleton } from '@/components/ui/skeleton-loaders';
import {
  ClipboardList,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Wrench,
  ArrowRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

const PRIORITY_COLORS: Record<string, string> = {
  alta: '#e62923',
  media: '#f59e0b',
  baja: '#22c55e',
};

const TYPE_COLORS: Record<string, string> = {
  correctivo: '#e62923',
  preventivo: '#229877',
  predictivo: '#3b82f6',
};

const tooltipStyle = {
  backgroundColor: 'oklch(0.17 0.005 260)',
  border: '1px solid oklch(0.28 0.005 260)',
  borderRadius: '8px',
  color: 'oklch(0.97 0 0)',
};

function DashboardPage() {
  const { data, loading, error } = useQuery<{
    dashboardStats: {
      totalOTs: number;
      pendingOTs: number;
      inProgressOTs: number;
      completedOTs: number;
      cancelledOTs: number;
      avgResolutionTime: number;
      otsByTechnician: { technicianId: string; name: string; count: number }[];
      otsByPriority: { priority: string; count: number }[];
      otsByMaintenanceType: { type: string; count: number }[];
      weeklyTrend: { date: string; count: number }[];
    };
  }>(GET_DASHBOARD_STATS);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">Error al cargar datos</h3>
          <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  const stats = data?.dashboardStats;
  if (!stats) return null;

  const priorityData = stats.otsByPriority.map((item) => ({
    name: item.priority === 'alta' ? 'Alta' : item.priority === 'media' ? 'Media' : 'Baja',
    value: item.count,
    color: PRIORITY_COLORS[item.priority] || '#888',
  }));

  const typeData = stats.otsByMaintenanceType.map((item) => ({
    name: item.type === 'correctivo' ? 'Correctivo' : item.type === 'preventivo' ? 'Preventivo' : 'Predictivo',
    value: item.count,
    color: TYPE_COLORS[item.type] || '#888',
  }));

  const trendData = stats.weeklyTrend.map((item) => ({
    date: new Date(item.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
    ordenes: item.count,
  }));

  const techData = stats.otsByTechnician.map((item) => ({
    name: item.name.split(' ')[0],
    ordenes: item.count,
  }));

  const completionRate = stats.totalOTs > 0 ? Math.round((stats.completedOTs / stats.totalOTs) * 100) : 0;

  const handleNavigate = (href: string) => {
    // TODO: En produccion, usar navigate(href) de react-router-dom
    window.location.href = href;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground text-balance">Panel de Control</h1>
          <p className="text-muted-foreground">Resumen general del sistema de mantenimiento</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleNavigate('/admin/ordenes')}>
            <ClipboardList className="mr-2 h-4 w-4" />
            Ver todas las OT
          </Button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total OT</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalOTs}</div>
            <p className="text-xs text-muted-foreground">Registradas en el sistema</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.pendingOTs}</div>
            <p className="text-xs text-muted-foreground">Esperando asignacion</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">En Progreso</CardTitle>
            <Wrench className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.inProgressOTs}</div>
            <p className="text-xs text-muted-foreground">Trabajos activos</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.completedOTs}</div>
            <p className="text-xs text-muted-foreground">Finalizadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Canceladas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.cancelledOTs}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tecnicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.otsByTechnician.length}</div>
            <p className="text-xs text-muted-foreground">Con OTs asignadas</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tiempo Promedio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.avgResolutionTime}h</div>
            <p className="text-xs text-muted-foreground">Resolucion</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tasa Completacion</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{completionRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">OT por Prioridad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={priorityData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="value" label={({ name, value }: { name: string; value: number }) => `${name}: ${value}`}>
                    {priorityData.map((entry, index) => (
                      <Cell key={`pri-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">OT por Tipo de Mantenimiento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.005 260)" />
                  <XAxis dataKey="name" stroke="oklch(0.65 0 0)" tick={{ fontSize: 12 }} />
                  <YAxis stroke="oklch(0.65 0 0)" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {typeData.map((entry, index) => (
                      <Cell key={`type-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend & Technician Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Tendencia Semanal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.005 260)" />
                  <XAxis dataKey="date" stroke="oklch(0.65 0 0)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="oklch(0.65 0 0)" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="ordenes" stroke="#229877" strokeWidth={2} dot={{ fill: '#229877', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">OTs por Tecnico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={techData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.005 260)" />
                  <XAxis type="number" stroke="oklch(0.65 0 0)" />
                  <YAxis dataKey="name" type="category" stroke="oklch(0.65 0 0)" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="ordenes" fill="#229877" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Acciones Rapidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 bg-transparent" onClick={() => handleNavigate('/admin/crear-ot')}>
              <ClipboardList className="h-5 w-5" />
              <span className="text-xs">Crear OT</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 bg-transparent" onClick={() => handleNavigate('/admin/asignar')}>
              <Users className="h-5 w-5" />
              <span className="text-xs">Asignar Tecnicos</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 bg-transparent" onClick={() => handleNavigate('/admin/horarios')}>
              <Clock className="h-5 w-5" />
              <span className="text-xs">Ver Horarios</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 bg-transparent" onClick={() => handleNavigate('/admin/ordenes')}>
              <ArrowRight className="h-5 w-5" />
              <span className="text-xs">Todas las OT</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DashboardPage;

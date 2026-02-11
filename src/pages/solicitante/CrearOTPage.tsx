'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@/lib/graphql/hooks';
import { useAuth } from '@/contexts/auth-context';
import { GET_AREAS, CREATE_WORK_ORDER } from '@/lib/graphql/queries';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { FileText, MapPin, AlertTriangle, CheckCircle, Send, ArrowLeft } from 'lucide-react';
import type { Area, OTType, OTPriority } from '@/lib/types';

const OT_TYPES: { value: OTType; label: string }[] = [
  { value: 'correctivo', label: 'Correctivo' },
  { value: 'preventivo', label: 'Preventivo' },
  { value: 'predictivo', label: 'Predictivo' },
  { value: 'mejora', label: 'Mejora' },
  { value: 'emergencia', label: 'Emergencia' },
];

const PRIORITIES: { value: OTPriority; label: string }[] = [
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
  { value: 'critica', label: 'Critica' },
];

export default function SolicitanteCrearOTPage() {
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    description: '',
    type: '' as OTType | '',
    priority: '' as OTPriority | '',
    areaId: '',
    equipmentDescription: '',
    notes: '',
  });

  const { data: areasData } = useQuery(GET_AREAS);
  const [createWorkOrder, { loading: creating }] = useMutation(CREATE_WORK_ORDER);

  const areas: Area[] = areasData?.areas || [];

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const isValid = form.description.trim() && form.type && form.priority && form.areaId;

  const handleSubmit = useCallback(async () => {
    if (!isValid || !user) return;
    try {
      await createWorkOrder({
        variables: {
          input: {
            description: form.description.trim(),
            type: form.type,
            priority: form.priority,
            areaId: form.areaId,
            equipmentDescription: form.equipmentDescription.trim() || undefined,
            requesterId: user.id,
            notes: form.notes.trim() || undefined,
          },
        },
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Error creating work order:', err);
    }
  }, [isValid, user, form, createWorkOrder]);

  if (submitted) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-primary/20 p-6 mb-6">
            <CheckCircle className="h-16 w-16 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Orden creada exitosamente</h2>
          <p className="text-muted-foreground text-center max-w-md mb-8">
            Tu solicitud de mantenimiento ha sido registrada. Recibiras notificaciones sobre su progreso.
          </p>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => { setSubmitted(false); setForm({ description: '', type: '', priority: '', areaId: '', equipmentDescription: '', notes: '' }); }}>
              Crear otra
            </Button>
            <Button onClick={() => { window.location.href = '/solicitante/mis-ordenes'; }}>
              Ver mis ordenes
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Nueva Orden de Trabajo</h1>
            <p className="text-muted-foreground">Completa el formulario para solicitar mantenimiento</p>
          </div>
        </div>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Datos de la solicitud
            </CardTitle>
            <CardDescription>Los campos marcados con * son obligatorios</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Descripcion del problema *</Label>
              <Textarea
                id="description"
                placeholder="Describe detalladamente el problema o la necesidad de mantenimiento..."
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            {/* Type + Priority */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo de mantenimiento *</Label>
                <Select value={form.type} onValueChange={(v) => handleChange('type', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {OT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Prioridad *</Label>
                <Select value={form.priority} onValueChange={(v) => handleChange('priority', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Area */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <MapPin className="h-4 w-4" /> Area / Ubicacion *
              </Label>
              <Select value={form.areaId} onValueChange={(v) => handleChange('areaId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar area" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Equipment */}
            <div className="space-y-2">
              <Label htmlFor="equipment">Equipo o maquina (opcional)</Label>
              <Input
                id="equipment"
                placeholder="Nombre o codigo del equipo afectado"
                value={form.equipmentDescription}
                onChange={(e) => handleChange('equipmentDescription', e.target.value)}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas adicionales (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Informacion adicional relevante..."
                value={form.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
              />
            </div>

            {form.priority === 'critica' && (
              <div className="flex items-start gap-3 rounded-lg bg-destructive/10 border border-destructive/30 p-4">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Prioridad critica seleccionada</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Las ordenes criticas se atienden de forma inmediata. Asegurate de que la situacion lo amerite.
                  </p>
                </div>
              </div>
            )}

            <Button
              className="w-full gap-2"
              size="lg"
              disabled={!isValid || creating}
              onClick={handleSubmit}
            >
              <Send className="h-4 w-4" />
              {creating ? 'Enviando...' : 'Enviar solicitud'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

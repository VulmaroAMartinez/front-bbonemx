'use client';

/**
 * BB Maintenance - Admin Crear OT Page
 * Formulario para crear orden de trabajo como admin
 * Componente React puro (sin dependencias de Next.js)
 */

import React from 'react';
import { useState } from 'react';
import { useQuery, useMutation } from '@/lib/graphql/hooks';
import { GET_AREAS, CREATE_WORK_ORDER } from '@/lib/graphql/queries';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import type { Area } from '@/lib/types';

function AdminCrearOTPage() {
  const { data: areasData, loading: areasLoading } = useQuery<{ areas: Area[] }>(GET_AREAS);
  const [createWorkOrder, { loading: creating }] = useMutation(CREATE_WORK_ORDER);

  const [form, setForm] = useState({
    areaId: '',
    activityDescription: '',
  });
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!form.areaId) {
      setFormError('Seleccione un area');
      return;
    }
    if (!form.activityDescription.trim()) {
      setFormError('Ingrese la descripcion de la actividad');
      return;
    }

    try {
      await createWorkOrder({
        variables: {
          input: {
            areaId: form.areaId,
            activityDescription: form.activityDescription,
          },
        },
      });
      setSuccess(true);
      setTimeout(() => {
        // TODO: En produccion, usar navigate('/admin/ordenes') de react-router-dom
        window.location.href = '/admin/ordenes';
      }, 1500);
    } catch {
      setFormError('Error al crear la orden de trabajo');
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Orden creada exitosamente</h3>
          <p className="text-sm text-muted-foreground mt-1">Redirigiendo a la lista de ordenes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => window.history.back()}
        className="text-muted-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver
      </Button>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <PlusCircle className="h-5 w-5 text-primary" />
            Nueva Orden de Trabajo
          </CardTitle>
          <CardDescription>Complete el formulario para registrar una nueva OT</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {formError && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {formError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="area">Area</Label>
              <Select value={form.areaId} onValueChange={(value) => setForm((p) => ({ ...p, areaId: value }))}>
                <SelectTrigger id="area" className="bg-input border-border">
                  <SelectValue placeholder={areasLoading ? 'Cargando areas...' : 'Seleccionar area'} />
                </SelectTrigger>
                <SelectContent>
                  {areasData?.areas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      <span className="font-mono text-xs text-primary mr-2">[{area.code}]</span>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripcion de la Actividad</Label>
              <Textarea
                id="description"
                value={form.activityDescription}
                onChange={(e) => setForm((p) => ({ ...p, activityDescription: e.target.value }))}
                placeholder="Describa detalladamente la situacion o problema encontrado..."
                className="min-h-[120px] bg-input border-border"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {form.activityDescription.length}/500
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => window.history.back()} className="flex-1 bg-transparent">
                Cancelar
              </Button>
              <Button type="submit" disabled={creating} className="flex-1">
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Crear OT
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminCrearOTPage;

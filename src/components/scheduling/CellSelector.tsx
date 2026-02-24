import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ShiftItem, AbsenceReasonItem, ScheduleEntry } from './types';
import { stringToColor } from '@/lib/utils/scheduling';
import { Clock, Calendar, X } from 'lucide-react';

interface CellSelectorProps {
    open: boolean;
    onClose: () => void;
    shifts: ShiftItem[];
    absenceReasons: AbsenceReasonItem[];
    currentSchedule?: ScheduleEntry;
    onSelect: (type: 'shift' | 'absence', id: string) => void;
}

export function CellSelector({
    open,
    onClose,
    shifts,
    absenceReasons,
    currentSchedule,
    onSelect,
}: CellSelectorProps) {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Asignar Horario</DialogTitle>
                    <DialogDescription>Selecciona un turno o una ausencia para esta celda</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {currentSchedule && (
                        <div className="rounded-lg border border-border p-3 bg-muted/30">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Asignacion actual:</p>
                            {currentSchedule.shift && (
                                <Badge variant="secondary">{currentSchedule.shift.name}</Badge>
                            )}
                            {currentSchedule.absenceReason && (
                                <Badge variant="outline">{currentSchedule.absenceReason.name}</Badge>
                            )}
                        </div>
                    )}

                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="h-4 w-4 text-primary" />
                            <p className="text-sm font-medium text-foreground">Turnos</p>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            {shifts.map((shift) => (
                                <Button
                                    key={shift.id}
                                    variant="outline"
                                    className="justify-start bg-transparent h-auto py-2"
                                    onClick={() => {
                                        onSelect('shift', shift.id);
                                        onClose();
                                    }}
                                >
                                    <div
                                        className="h-3 w-3 rounded-full mr-2 shrink-0"
                                        style={{ backgroundColor: stringToColor(shift.name) }}
                                    />
                                    <div className="flex-1 text-left">
                                        <p className="text-sm font-medium">{shift.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {shift.startTime} - {shift.endTime}
                                        </p>
                                    </div>
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-4 w-4 text-primary" />
                            <p className="text-sm font-medium text-foreground">Ausencias</p>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            {absenceReasons.filter((a) => a.isActive).map((absence) => (
                                <Button
                                    key={absence.id}
                                    variant="outline"
                                    className="justify-start bg-transparent h-auto py-2"
                                    onClick={() => {
                                        onSelect('absence', absence.id);
                                        onClose();
                                    }}
                                >
                                    <div className="flex-1 text-left">
                                        <p className="text-sm font-medium">{absence.name}</p>
                                        {absence.maxPerWeek != null && (
                                            <p className="text-xs text-muted-foreground">
                                                Limite: {absence.maxPerWeek} por semana
                                            </p>
                                        )}
                                    </div>
                                </Button>
                            ))}
                        </div>
                    </div>

                    {currentSchedule && (
                        <Button variant="outline" onClick={onClose} className="w-full bg-transparent">
                            <X className="mr-2 h-4 w-4" />
                            Cancelar
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

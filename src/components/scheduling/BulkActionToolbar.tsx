import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { ShiftDefinition, AbsenceReason } from '@/lib/types/scheduling';
import { X, Trash2 } from 'lucide-react';
import { stringToColor } from '@/lib/utils/scheduling';

interface BulkActionToolbarProps {
    selectionCount: number;
    shifts: ShiftDefinition[];
    absenceReasons: AbsenceReason[];
    onAssignShift: (shiftId: string) => void;
    onAssignAbsence: (absenceId: string) => void;
    onClear: () => void;
    onCancel: () => void;
}

export function BulkActionToolbar({
    selectionCount,
    shifts,
    absenceReasons,
    onAssignShift,
    onAssignAbsence,
    onClear,
    onCancel,
}: BulkActionToolbarProps) {
    return (
        <Card className="bg-primary/5 border-primary/20 shadow-lg">
            <CardContent className="py-3">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">{selectionCount}</span>
                        </div>
                        <span className="text-sm font-medium text-foreground">celdas seleccionadas</span>
                    </div>

                    <div className="h-6 w-px bg-border" />

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Asignar Turno:</span>
                        <Select onValueChange={onAssignShift}>
                            <SelectTrigger className="w-[180px] h-8">
                                <SelectValue placeholder="Seleccionar..." />
                            </SelectTrigger>
                            <SelectContent>
                                {shifts.map((shift) => (
                                    <SelectItem key={shift.id} value={shift.id}>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="h-3 w-3 rounded-full"
                                                style={{ backgroundColor: stringToColor(shift.name) }}
                                            />
                                            <span>{shift.name}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Asignar Ausencia:</span>
                        <Select onValueChange={onAssignAbsence}>
                            <SelectTrigger className="w-[180px] h-8">
                                <SelectValue placeholder="Seleccionar..." />
                            </SelectTrigger>
                            <SelectContent>
                                {absenceReasons.filter((a) => a.isActive).map((absence) => (
                                    <SelectItem key={absence.id} value={absence.id}>
                                        {absence.name}
                                        {absence.maxPerWeek !== null && (
                                            <span className="text-xs text-muted-foreground ml-1">
                                                (max {absence.maxPerWeek}/sem)
                                            </span>
                                        )}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="h-6 w-px bg-border" />

                    <Button variant="outline" size="sm" onClick={onClear} className="bg-transparent">
                        <Trash2 className="mr-2 h-3 w-3" />
                        Limpiar
                    </Button>

                    <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@/lib/graphql/hooks';
import { GET_TECHNICIANS } from '@/lib/graphql/queries';
import {
    GET_SHIFT_DEFINITIONS,
    GET_ABSENCE_REASONS,
    GET_WEEK_SCHEDULES,
    BULK_ASSIGN_SCHEDULES,
    COPY_WEEK_SCHEDULES,
    CLEAR_SCHEDULES,
} from '@/lib/graphql/scheduling-queries';
import {
    getWeekNumber,
    getWeekDates,
    formatWeekLabel,
    validateAbsenceLimits,
    getSelectionBounds,
    isCellSelected,
    stringToColor,
} from '@/lib/utils/scheduling';
import type {
    ShiftDefinition,
    AbsenceReason,
    ScheduleEntry,
    CellSelection,
    GridMode,
    ScheduleFilter,
    WeeklyTemplate,
    ScheduleAction,
    ValidationError,
} from '@/lib/types/scheduling';
import type { User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Copy,
    Save,
    Edit3,
    Search,
    Filter,
    AlertCircle,
    CheckCircle,
    X,
    Undo,
    Layers,
} from 'lucide-react';
import { ScheduleGrid } from '@/components/scheduling/ScheduleGrid';
import { BulkActionToolbar } from '@/components/scheduling/BulkActionToolbar';
import { TemplatePanel } from '@/components/scheduling/TemplatePanel';
import { CellSelector } from '@/components/scheduling/CellSelector';

const DAYS_OF_WEEK = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

// Predefined templates
const DEFAULT_TEMPLATES: WeeklyTemplate[] = [
    {
        id: 'mon-fri-shift1',
        name: 'Lun-Vie Turno 1',
        description: 'Lunes a Viernes en turno matutino',
        pattern: [
            { dayOfWeek: 1, shiftId: 'shift1' },
            { dayOfWeek: 2, shiftId: 'shift1' },
            { dayOfWeek: 3, shiftId: 'shift1' },
            { dayOfWeek: 4, shiftId: 'shift1' },
            { dayOfWeek: 5, shiftId: 'shift1' },
        ],
    },
    {
        id: 'mon-fri-shift2',
        name: 'Lun-Vie Turno 2',
        description: 'Lunes a Viernes en turno vespertino',
        pattern: [
            { dayOfWeek: 1, shiftId: 'shift2' },
            { dayOfWeek: 2, shiftId: 'shift2' },
            { dayOfWeek: 3, shiftId: 'shift2' },
            { dayOfWeek: 4, shiftId: 'shift2' },
            { dayOfWeek: 5, shiftId: 'shift2' },
        ],
    },
    {
        id: 'weekend-rest',
        name: 'Descanso Fin de Semana',
        description: 'Descanso Sabado y Domingo',
        pattern: [
            { dayOfWeek: 6, absenceReasonId: 'rest' },
            { dayOfWeek: 7, absenceReasonId: 'rest' },
        ],
    },
];

function EnterpriseSchedulingPage() {
    const today = new Date();
    const { week: currentWeekNum, year: currentYear } = getWeekNumber(today);

    const [weekNumber, setWeekNumber] = useState(currentWeekNum);
    const [year, setYear] = useState(currentYear);
    const [mode, setMode] = useState<GridMode>('edit');
    const [filter, setFilter] = useState<ScheduleFilter>({});
    const [showFilters, setShowFilters] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [selectedCells, setSelectedCells] = useState<CellSelection[]>([]);
    const [dragStart, setDragStart] = useState<CellSelection | null>(null);
    const [activeCellSelector, setActiveCellSelector] = useState<CellSelection | null>(null);
    const [undoStack, setUndoStack] = useState<ScheduleAction[]>([]);
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const weekDates = useMemo(() => getWeekDates(weekNumber, year), [weekNumber, year]);
    const weekLabel = useMemo(() => formatWeekLabel(weekNumber, year), [weekNumber, year]);

    // Queries
    const { data: techData, loading: techLoading } = useQuery<{ technicians: User[] }>(GET_TECHNICIANS);
    const { data: shiftsData, loading: shiftsLoading } = useQuery<{ shifts: ShiftDefinition[] }>(
        GET_SHIFT_DEFINITIONS
    );
    const { data: absencesData, loading: absencesLoading } = useQuery<{ absenceReasons: AbsenceReason[] }>(
        GET_ABSENCE_REASONS
    );
    const {
        data: schedulesData,
        loading: schedulesLoading,
        refetch,
    } = useQuery<{ weekSchedules: ScheduleEntry[] }>(GET_WEEK_SCHEDULES, {
        variables: { weekNumber, year },
    });

    // Mutations
    const [bulkAssign, { loading: saving }] = useMutation(BULK_ASSIGN_SCHEDULES);
    const [copyWeek, { loading: copying }] = useMutation(COPY_WEEK_SCHEDULES);
    const [clearSchedules] = useMutation(CLEAR_SCHEDULES);

    const technicians = techData?.technicians || [];
    const shifts = shiftsData?.shifts || [];
    const absenceReasons = absencesData?.absenceReasons || [];
    const schedules = schedulesData?.weekSchedules || [];

    const isLoading = techLoading || shiftsLoading || absencesLoading || schedulesLoading;

    // Validate schedules
    useEffect(() => {
        if (schedules.length > 0 && absenceReasons.length > 0) {
            const errors: ValidationError[] = [];
            technicians.forEach((tech) => {
                const techErrors = validateAbsenceLimits(schedules, absenceReasons, tech.id, weekDates);
                errors.push(...techErrors);
            });
            setValidationErrors(errors);
        }
    }, [schedules, absenceReasons, technicians, weekDates]);

    // Week navigation
    const navigateWeek = useCallback((direction: number) => {
        const d = new Date();
        d.setFullYear(year);
        d.setDate(d.getDate() + direction * 7);
        const { week, year: newYear } = getWeekNumber(d);
        setWeekNumber(week);
        setYear(newYear);
        setSelectedCells([]);
        setHasUnsavedChanges(false);
    }, [year]);

    // Copy previous week
    const handleCopyPreviousWeek = useCallback(async () => {
        const prevWeek = weekNumber - 1;
        const prevYear = prevWeek < 1 ? year - 1 : year;
        const actualPrevWeek = prevWeek < 1 ? 52 : prevWeek;

        try {
            await copyWeek({
                variables: {
                    input: {
                        sourceWeekNumber: actualPrevWeek,
                        sourceYear: prevYear,
                        targetWeekNumber: weekNumber,
                        targetYear: year,
                    },
                },
            });
            refetch();
        } catch (error) {
            console.error('[v0] Error copying week:', error);
        }
    }, [weekNumber, year, copyWeek, refetch]);

    // Cell click handler
    const handleCellClick = useCallback(
        (technicianId: string, date: string, isShiftSelect: boolean) => {
            if (mode === 'edit' && isShiftSelect) {
                setActiveCellSelector({ technicianId, date });
            }
        },
        [mode]
    );

    // Cell selection (Shift + click)
    const handleCellSelect = useCallback(
        (technicianId: string, date: string, shiftKey: boolean) => {
            if (mode !== 'edit') return;

            if (!shiftKey) {
                setSelectedCells([{ technicianId, date }]);
            } else {
                if (selectedCells.length === 0) {
                    setSelectedCells([{ technicianId, date }]);
                } else {
                    const lastSelected = selectedCells[selectedCells.length - 1];
                    const techIds = technicians.map((t) => t.id);
                    const bounds = getSelectionBounds(lastSelected, { technicianId, date }, techIds, weekDates);
                    setSelectedCells(bounds);
                }
            }
        },
        [mode, selectedCells, technicians, weekDates]
    );

    // Drag selection
    const handleDragStart = useCallback(
        (technicianId: string, date: string) => {
            if (mode === 'edit') {
                setDragStart({ technicianId, date });
                setSelectedCells([{ technicianId, date }]);
            }
        },
        [mode]
    );

    const handleDragOver = useCallback(
        (technicianId: string, date: string) => {
            if (dragStart && mode === 'edit') {
                const techIds = technicians.map((t) => t.id);
                const bounds = getSelectionBounds(dragStart, { technicianId, date }, techIds, weekDates);
                setSelectedCells(bounds);
            }
        },
        [dragStart, mode, technicians, weekDates]
    );

    const handleDragEnd = useCallback(() => {
        setDragStart(null);
    }, []);

    // Assign shift/absence to selected cells
    const handleBulkAssign = useCallback(
        async (type: 'shift' | 'absence', id: string) => {
            if (selectedCells.length === 0) return;

            const inputs = selectedCells.map((cell) => ({
                technicianId: cell.technicianId,
                scheduleDate: cell.date,
                shiftId: type === 'shift' ? id : null,
                absenceReasonId: type === 'absence' ? id : null,
            }));

            try {
                await bulkAssign({ variables: { inputs } });
                setHasUnsavedChanges(true);
                refetch();
                setSelectedCells([]);
            } catch (error) {
                console.error('[v0] Error bulk assigning:', error);
            }
        },
        [selectedCells, bulkAssign, refetch]
    );

    // Clear selected cells
    const handleClearSelection = useCallback(async () => {
        if (selectedCells.length === 0) return;

        const grouped = new Map<string, string[]>();
        selectedCells.forEach((cell) => {
            if (!grouped.has(cell.technicianId)) grouped.set(cell.technicianId, []);
            grouped.get(cell.technicianId)!.push(cell.date);
        });

        try {
            for (const [techId, dates] of grouped) {
                await clearSchedules({ variables: { technicianId: techId, dates } });
            }
            setHasUnsavedChanges(true);
            refetch();
            setSelectedCells([]);
        } catch (error) {
            console.error('[v0] Error clearing schedules:', error);
        }
    }, [selectedCells, clearSchedules, refetch]);

    // Apply template
    const handleApplyTemplate = useCallback(
        async (template: WeeklyTemplate) => {
            if (selectedCells.length === 0) return;

            const techIds = Array.from(new Set(selectedCells.map((c) => c.technicianId)));
            const inputs: any[] = [];

            techIds.forEach((techId) => {
                template.pattern.forEach((day) => {
                    const dateIdx = day.dayOfWeek - 1;
                    const date = weekDates[dateIdx];
                    inputs.push({
                        technicianId: techId,
                        scheduleDate: date,
                        shiftId: day.shiftId || null,
                        absenceReasonId: day.absenceReasonId || null,
                    });
                });
            });

            try {
                await bulkAssign({ variables: { inputs } });
                setHasUnsavedChanges(true);
                refetch();
                setSelectedCells([]);
                setShowTemplates(false);
            } catch (error) {
                console.error('[v0] Error applying template:', error);
            }
        },
        [selectedCells, weekDates, bulkAssign, refetch]
    );

    // Cell selector dialog
    const handleSelectAssignment = useCallback(
        async (type: 'shift' | 'absence', id: string) => {
            if (!activeCellSelector) return;

            const input = {
                technicianId: activeCellSelector.technicianId,
                scheduleDate: activeCellSelector.date,
                shiftId: type === 'shift' ? id : null,
                absenceReasonId: type === 'absence' ? id : null,
            };

            try {
                await bulkAssign({ variables: { inputs: [input] } });
                setHasUnsavedChanges(true);
                refetch();
                setActiveCellSelector(null);
            } catch (error) {
                console.error('[v0] Error assigning:', error);
            }
        },
        [activeCellSelector, bulkAssign, refetch]
    );

    // Get schedule entry for cell
    const getSchedule = useCallback(
        (technicianId: string, date: string): ScheduleEntry | undefined => {
            return schedules.find((s) => s.technicianId === technicianId && s.scheduleDate === date);
        },
        [schedules]
    );

    // Check if cell has error
    const hasError = useCallback(
        (technicianId: string, date: string): boolean => {
            return validationErrors.some((e) => e.technicianId === technicianId && e.date === date);
        },
        [validationErrors]
    );

    const conflictCount = validationErrors.length;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                    <p className="mt-4 text-muted-foreground">Cargando horarios...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 h-full flex flex-col">
            {/* Top Action Bar */}
            <Card className="bg-card border-border">
                <CardContent className="py-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        {/* Week Navigation */}
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={() => navigateWeek(-1)} className="bg-transparent">
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center gap-2 min-w-[250px]">
                                <Calendar className="h-5 w-5 text-primary" />
                                <span className="font-medium text-sm">{weekLabel}</span>
                            </div>
                            <Button variant="outline" size="icon" onClick={() => navigateWeek(1)} className="bg-transparent">
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={handleCopyPreviousWeek} disabled={copying} className="bg-transparent">
                                <Copy className="mr-2 h-4 w-4" />
                                Copiar Semana Anterior
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => setShowTemplates(!showTemplates)}
                                className="bg-transparent"
                            >
                                <Layers className="mr-2 h-4 w-4" />
                                Plantillas
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => setShowFilters(!showFilters)}
                                className="bg-transparent"
                            >
                                <Filter className="mr-2 h-4 w-4" />
                                Filtros
                            </Button>

                            <Button
                                variant={mode === 'edit' ? 'default' : 'outline'}
                                onClick={() => setMode(mode === 'edit' ? 'query' : 'edit')}
                                className={mode === 'query' ? 'bg-transparent' : ''}
                            >
                                {mode === 'edit' ? <Edit3 className="mr-2 h-4 w-4" /> : <Search className="mr-2 h-4 w-4" />}
                                {mode === 'edit' ? 'Edicion' : 'Consulta'}
                            </Button>

                            {conflictCount > 0 && (
                                <Badge variant="destructive" className="gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {conflictCount} conflictos
                                </Badge>
                            )}

                            {hasUnsavedChanges && (
                                <Badge variant="secondary" className="gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    Cambios guardados
                                </Badge>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Bulk Action Toolbar */}
            {selectedCells.length > 0 && mode === 'edit' && (
                <BulkActionToolbar
                    selectionCount={selectedCells.length}
                    shifts={shifts}
                    absenceReasons={absenceReasons}
                    onAssignShift={(id) => handleBulkAssign('shift', id)}
                    onAssignAbsence={(id) => handleBulkAssign('absence', id)}
                    onClear={handleClearSelection}
                    onCancel={() => setSelectedCells([])}
                />
            )}

            {/* Template Panel */}
            {showTemplates && (
                <TemplatePanel
                    templates={DEFAULT_TEMPLATES}
                    onApply={handleApplyTemplate}
                    onClose={() => setShowTemplates(false)}
                    disabled={selectedCells.length === 0}
                />
            )}

            {/* Main Grid */}
            <div className="flex-1 overflow-hidden">
                <ScheduleGrid
                    technicians={technicians}
                    weekDates={weekDates}
                    daysOfWeek={DAYS_OF_WEEK}
                    schedules={schedules}
                    shifts={shifts}
                    absenceReasons={absenceReasons}
                    selectedCells={selectedCells}
                    validationErrors={validationErrors}
                    mode={mode}
                    onCellClick={handleCellClick}
                    onCellSelect={handleCellSelect}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                    getSchedule={getSchedule}
                    hasError={hasError}
                />
            </div>

            {/* Cell Selector Dialog */}
            {activeCellSelector && (
                <CellSelector
                    open={!!activeCellSelector}
                    onClose={() => setActiveCellSelector(null)}
                    shifts={shifts}
                    absenceReasons={absenceReasons}
                    currentSchedule={getSchedule(activeCellSelector.technicianId, activeCellSelector.date)}
                    onSelect={handleSelectAssignment}
                />
            )}

            {/* Stats Bar */}
            <Card className="bg-card border-border">
                <CardContent className="py-3">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex gap-6">
                            <span className="text-muted-foreground">
                                Tecnicos: <span className="font-medium text-foreground">{technicians.length}</span>
                            </span>
                            <span className="text-muted-foreground">
                                Asignaciones: <span className="font-medium text-foreground">{schedules.length}</span>
                            </span>
                            <span className="text-muted-foreground">
                                Turnos: <span className="font-medium text-foreground">{shifts.length}</span>
                            </span>
                        </div>
                        <div className="flex gap-2">
                            {mode === 'edit' && selectedCells.length > 0 && (
                                <span className="text-primary font-medium">{selectedCells.length} celdas seleccionadas</span>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default EnterpriseSchedulingPage;

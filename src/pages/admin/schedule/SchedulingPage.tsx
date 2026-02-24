import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import {
    GetWeekScheduleDocument,
    GetScheduleTechniciansDocument,
    GetShiftsDocument,
    GetAbsenceReasonsActiveDocument,
    AssignWeekScheduleDocument,
    CopyWeekSchedulesDocument,
    ScheduleItemFragmentDoc,
} from '@/lib/graphql/generated/graphql';
import { useFragment } from '@/lib/graphql/generated/fragment-masking';
import type {
    CellSelection,
    GridMode,
    ValidationError,
    WeeklyTemplate,
    ScheduleEntry,
} from '@/components/scheduling/types';
import {
    getWeekNumber,
    getWeekDates,
    formatWeekLabel,
    validateAbsenceLimits,
    getSelectionBounds,
    normalizeDate,
} from '@/lib/utils/scheduling';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Copy,
    Edit3,
    Search,
    Filter,
    AlertCircle,
    CheckCircle,
    Layers,
} from 'lucide-react';
import { ScheduleGrid } from '@/components/scheduling/ScheduleGrid';
import { BulkActionToolbar } from '@/components/scheduling/BulkActionToolbar';
import { TemplatePanel } from '@/components/scheduling/TemplatePanel';
import { CellSelector } from '@/components/scheduling/CellSelector';

const DAYS_OF_WEEK = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

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
    const [showFilters, setShowFilters] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [selectedCells, setSelectedCells] = useState<CellSelection[]>([]);
    const [dragStart, setDragStart] = useState<CellSelection | null>(null);
    const [activeCellSelector, setActiveCellSelector] = useState<CellSelection | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const weekDates = useMemo(() => getWeekDates(weekNumber, year), [weekNumber, year]);
    const weekLabel = useMemo(() => formatWeekLabel(weekNumber, year), [weekNumber, year]);

    // --- Queries ---
    const { data: techData, loading: techLoading } = useQuery(GetScheduleTechniciansDocument);
    const { data: shiftsData, loading: shiftsLoading } = useQuery(GetShiftsDocument);
    const { data: absencesData, loading: absencesLoading } = useQuery(GetAbsenceReasonsActiveDocument);
    const {
        data: schedulesData,
        loading: schedulesLoading,
        refetch,
    } = useQuery(GetWeekScheduleDocument, {
        variables: { weekNumber, year },
    });

    // --- Mutations ---
    const [assignWeekSchedule, { loading: saving }] = useMutation(AssignWeekScheduleDocument);
    const [copyWeek, { loading: copying }] = useMutation(CopyWeekSchedulesDocument);

    // --- Derived data ---
    const technicians = techData?.techniciansActive ?? [];
    const shifts = shiftsData?.shiftsActive ?? [];
    const absenceReasons = absencesData?.absenceReasonsActive ?? [];

    const rawSchedules = useFragment(
        ScheduleItemFragmentDoc,
        schedulesData?.weekSchedule?.schedules ?? []
    );

    const schedules: ScheduleEntry[] = useMemo(
        () => rawSchedules.map((s) => ({ ...s })),
        [rawSchedules]
    );

    const techUserIds = useMemo(
        () => technicians.map((t) => t.user.id),
        [technicians]
    );

    const isLoading = techLoading || shiftsLoading || absencesLoading || schedulesLoading;

    // --- Validation (derivada, sin estado local) ---
    const validationErrors: ValidationError[] = useMemo(() => {
        if (schedules.length === 0 || absenceReasons.length === 0) return [];

        const errors: ValidationError[] = [];
        techUserIds.forEach((userId) => {
            const techErrors = validateAbsenceLimits(schedules, absenceReasons, userId, weekDates);
            errors.push(...techErrors);
        });
        return errors;
    }, [schedules, absenceReasons, techUserIds, weekDates]);

    // --- Week navigation ---
    const navigateWeek = useCallback(
        (direction: number) => {
            let newWeek = weekNumber + direction;
            let newYear = year;
            if (newWeek < 1) {
                newYear -= 1;
                newWeek = 52;
            } else if (newWeek > 52) {
                newYear += 1;
                newWeek = 1;
            }
            setWeekNumber(newWeek);
            setYear(newYear);
            setSelectedCells([]);
            setHasUnsavedChanges(false);
        },
        [weekNumber, year]
    );

    // --- Copy previous week ---
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
            console.error('Error copying week:', error);
        }
    }, [weekNumber, year, copyWeek, refetch]);

    // --- Helpers ---
    const getSchedule = useCallback(
        (technicianId: string, date: string): ScheduleEntry | undefined => {
            return schedules.find(
                (s) => s.technicianId === technicianId && normalizeDate(s.scheduleDate) === date
            );
        },
        [schedules]
    );

    const hasError = useCallback(
        (technicianId: string, date: string): boolean => {
            return validationErrors.some((e) => e.technicianId === technicianId && e.date === date);
        },
        [validationErrors]
    );

    const buildMergedWeekDays = useCallback(
        (techId: string, overrides: Map<string, { shiftId: string | null; absenceReasonId: string | null }>) => {
            const techSchedules = schedules.filter((s) => s.technicianId === techId);

            return weekDates
                .map((date) => {
                    const override = overrides.get(date);
                    const existing = techSchedules.find((s) => normalizeDate(s.scheduleDate) === date);

                    if (override) {
                        return {
                            scheduleDate: date,
                            shiftId: override.shiftId ?? undefined,
                            absenceReasonId: override.absenceReasonId ?? undefined,
                        };
                    }
                    if (existing) {
                        return {
                            scheduleDate: date,
                            shiftId: existing.shiftId ?? undefined,
                            absenceReasonId: existing.absenceReasonId ?? undefined,
                        };
                    }
                    return null;
                })
                .filter((d): d is NonNullable<typeof d> => d !== null);
        },
        [schedules, weekDates]
    );

    // --- Cell interactions ---
    const handleCellClick = useCallback(
        (technicianId: string, date: string, isShiftSelect: boolean) => {
            if (mode === 'edit' && isShiftSelect) {
                setActiveCellSelector({ technicianId, date });
            }
        },
        [mode]
    );

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
                    const bounds = getSelectionBounds(lastSelected, { technicianId, date }, techUserIds, weekDates);
                    setSelectedCells(bounds);
                }
            }
        },
        [mode, selectedCells, techUserIds, weekDates]
    );

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
                const bounds = getSelectionBounds(dragStart, { technicianId, date }, techUserIds, weekDates);
                setSelectedCells(bounds);
            }
        },
        [dragStart, mode, techUserIds, weekDates]
    );

    const handleDragEnd = useCallback(() => {
        setDragStart(null);
    }, []);

    // --- Assign shift/absence to selected cells ---
    const handleBulkAssign = useCallback(
        async (type: 'shift' | 'absence', id: string) => {
            if (selectedCells.length === 0) return;

            const byTechnician = new Map<string, string[]>();
            selectedCells.forEach((cell) => {
                if (!byTechnician.has(cell.technicianId)) byTechnician.set(cell.technicianId, []);
                byTechnician.get(cell.technicianId)!.push(cell.date);
            });

            try {
                for (const [techId, selectedDates] of byTechnician) {
                    const overrides = new Map<string, { shiftId: string | null; absenceReasonId: string | null }>();
                    selectedDates.forEach((date) => {
                        overrides.set(date, {
                            shiftId: type === 'shift' ? id : null,
                            absenceReasonId: type === 'absence' ? id : null,
                        });
                    });

                    const days = buildMergedWeekDays(techId, overrides);
                    await assignWeekSchedule({
                        variables: { input: { technicianId: techId, weekNumber, year, days } },
                    });
                }
                setHasUnsavedChanges(true);
                refetch();
                setSelectedCells([]);
            } catch (error) {
                console.error('Error bulk assigning:', error);
            }
        },
        [selectedCells, buildMergedWeekDays, assignWeekSchedule, weekNumber, year, refetch]
    );

    // --- Clear selected cells ---
    const handleClearSelection = useCallback(async () => {
        if (selectedCells.length === 0) return;

        const byTechnician = new Map<string, string[]>();
        selectedCells.forEach((cell) => {
            if (!byTechnician.has(cell.technicianId)) byTechnician.set(cell.technicianId, []);
            byTechnician.get(cell.technicianId)!.push(cell.date);
        });

        try {
            for (const [techId, clearDates] of byTechnician) {
                const techSchedules = schedules.filter((s) => s.technicianId === techId);
                const days = weekDates
                    .map((date) => {
                        if (clearDates.includes(date)) return null;
                        const existing = techSchedules.find((s) => normalizeDate(s.scheduleDate) === date);
                        if (existing) {
                            return {
                                scheduleDate: date,
                                shiftId: existing.shiftId ?? undefined,
                                absenceReasonId: existing.absenceReasonId ?? undefined,
                            };
                        }
                        return null;
                    })
                    .filter((d): d is NonNullable<typeof d> => d !== null);

                await assignWeekSchedule({
                    variables: { input: { technicianId: techId, weekNumber, year, days } },
                });
            }
            setHasUnsavedChanges(true);
            refetch();
            setSelectedCells([]);
        } catch (error) {
            console.error('Error clearing schedules:', error);
        }
    }, [selectedCells, schedules, weekDates, assignWeekSchedule, weekNumber, year, refetch]);

    // --- Apply template ---
    const handleApplyTemplate = useCallback(
        async (template: WeeklyTemplate) => {
            if (selectedCells.length === 0) return;

            const techIds = Array.from(new Set(selectedCells.map((c) => c.technicianId)));

            try {
                for (const techId of techIds) {
                    const days = template.pattern.map((day) => ({
                        scheduleDate: weekDates[day.dayOfWeek - 1],
                        shiftId: day.shiftId ?? undefined,
                        absenceReasonId: day.absenceReasonId ?? undefined,
                    }));

                    await assignWeekSchedule({
                        variables: { input: { technicianId: techId, weekNumber, year, days } },
                    });
                }
                setHasUnsavedChanges(true);
                refetch();
                setSelectedCells([]);
                setShowTemplates(false);
            } catch (error) {
                console.error('Error applying template:', error);
            }
        },
        [selectedCells, weekDates, assignWeekSchedule, weekNumber, year, refetch]
    );

    // --- Single cell selector ---
    const handleSelectAssignment = useCallback(
        async (type: 'shift' | 'absence', id: string) => {
            if (!activeCellSelector) return;
            const { technicianId, date } = activeCellSelector;

            const overrides = new Map<string, { shiftId: string | null; absenceReasonId: string | null }>();
            overrides.set(date, {
                shiftId: type === 'shift' ? id : null,
                absenceReasonId: type === 'absence' ? id : null,
            });

            try {
                const days = buildMergedWeekDays(technicianId, overrides);
                await assignWeekSchedule({
                    variables: { input: { technicianId, weekNumber, year, days } },
                });
                setHasUnsavedChanges(true);
                refetch();
                setActiveCellSelector(null);
            } catch (error) {
                console.error('Error assigning:', error);
            }
        },
        [activeCellSelector, buildMergedWeekDays, assignWeekSchedule, weekNumber, year, refetch]
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

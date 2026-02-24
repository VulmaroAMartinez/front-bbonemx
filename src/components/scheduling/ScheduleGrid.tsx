'use client';

import { useRef, useCallback, memo } from 'react';
import { List } from 'react-window';
import type {
    ScheduleEntry,
    ScheduleTechnician,
    ShiftItem,
    AbsenceReasonItem,
    CellSelection,
    ValidationError,
    GridMode,
} from './types';
import { stringToColor, isCellSelected } from '@/lib/utils/scheduling';
import { AlertCircle } from 'lucide-react';

const ROW_HEIGHT = 50;
const HEADER_HEIGHT = 60;
const NAME_COLUMN_WIDTH = 200;
const DAY_COLUMN_WIDTH = 140;

interface ScheduleGridProps {
    technicians: ScheduleTechnician[];
    weekDates: string[];
    daysOfWeek: string[];
    schedules: ScheduleEntry[];
    shifts: ShiftItem[];
    absenceReasons: AbsenceReasonItem[];
    selectedCells: CellSelection[];
    validationErrors: ValidationError[];
    mode: GridMode;
    onCellClick: (technicianId: string, date: string, isShiftSelect: boolean) => void;
    onCellSelect: (technicianId: string, date: string, shiftKey: boolean) => void;
    onDragStart: (technicianId: string, date: string) => void;
    onDragOver: (technicianId: string, date: string) => void;
    onDragEnd: () => void;
    getSchedule: (technicianId: string, date: string) => ScheduleEntry | undefined;
    hasError: (technicianId: string, date: string) => boolean;
}

const ScheduleCell = memo(
    ({
        technicianId,
        date,
        schedule,
        isSelected,
        hasError,
        mode,
        onClick,
        onSelect,
        onDragStart,
        onDragOver,
    }: {
        technicianId: string;
        date: string;
        schedule?: ScheduleEntry;
        isSelected: boolean;
        hasError: boolean;
        mode: GridMode;
        onClick: (technicianId: string, date: string, isShiftSelect: boolean) => void;
        onSelect: (technicianId: string, date: string, shiftKey: boolean) => void;
        onDragStart: (technicianId: string, date: string) => void;
        onDragOver: (technicianId: string, date: string) => void;
    }) => {
        const shift = schedule?.shift ?? null;
        const absence = schedule?.absenceReason ?? null;

        const bgColor = shift
            ? stringToColor(shift.name)
            : absence
                ? 'hsl(var(--muted))'
                : 'transparent';
        const textColor = shift ? 'white' : 'hsl(var(--muted-foreground))';

        return (
            <div
                className={`
                h-full border-r border-b border-border relative cursor-pointer transition-all
                ${isSelected ? 'ring-2 ring-primary ring-inset' : ''}
                ${hasError ? 'bg-destructive/10' : ''}
                `}
                style={{
                    backgroundColor: isSelected ? 'hsl(var(--primary) / 0.1)' : bgColor,
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    if (mode === 'edit') {
                        if (e.shiftKey) {
                            onSelect(technicianId, date, true);
                        } else {
                            onClick(technicianId, date, true);
                        }
                    }
                }}
                onMouseDown={(e) => {
                    if (mode === 'edit' && !e.shiftKey) {
                        onDragStart(technicianId, date);
                    }
                }}
                onMouseEnter={() => {
                    onDragOver(technicianId, date);
                }}
                onDoubleClick={(e) => {
                    e.stopPropagation();
                    onClick(technicianId, date, true);
                }}
            >
                <div className="p-2 h-full flex flex-col justify-center">
                    {shift && (
                        <div>
                            <p className="text-xs font-medium truncate" style={{ color: textColor }}>
                                {shift.name}
                            </p>
                            <p className="text-[10px] truncate opacity-90" style={{ color: textColor }}>
                                {shift.startTime} - {shift.endTime}
                            </p>
                        </div>
                    )}
                    {absence && !shift && (
                        <div>
                            <p className="text-xs font-medium truncate" style={{ color: textColor }}>
                                {absence.name}
                            </p>
                        </div>
                    )}
                    {!shift && !absence && <p className="text-xs text-muted-foreground text-center">-</p>}
                </div>
                {hasError && (
                    <div className="absolute top-1 right-1">
                        <AlertCircle className="h-3 w-3 text-destructive" />
                    </div>
                )}
            </div>
        );
    }
);

ScheduleCell.displayName = 'ScheduleCell';

export function ScheduleGrid({
    technicians,
    weekDates,
    daysOfWeek,
    selectedCells,
    mode,
    onCellClick,
    onCellSelect,
    onDragStart,
    onDragOver,
    onDragEnd,
    getSchedule,
    hasError,
}: ScheduleGridProps) {
    const listRef = useRef<List>(null);

    const RowComponent = useCallback(
        ({
            index,
            style,
            technicians,
            weekDates,
            daysOfWeek,
            selectedCells,
            mode,
            onCellClick,
            onCellSelect,
            onDragStart,
            onDragOver,
            getSchedule,
            hasError,
        }: any) => {
            const tech: ScheduleTechnician = technicians[index];
            const techUserId = tech.user.id;

            return (
                <div style={style} className="flex border-b border-border">
                    <div
                        className="sticky left-0 bg-card border-r border-border flex items-center px-3 z-10"
                        style={{ width: NAME_COLUMN_WIDTH, minWidth: NAME_COLUMN_WIDTH }}
                    >
                        <div className="truncate">
                            <p className="text-sm font-medium text-foreground truncate">{tech.user.fullName}</p>
                            <p className="text-xs text-muted-foreground truncate">{tech.position.name}</p>
                        </div>
                    </div>

                    {weekDates.map((date: string) => {
                        const schedule = getSchedule(techUserId, date);
                        const isSelected = isCellSelected({ technicianId: techUserId, date }, selectedCells);
                        const cellHasError = hasError(techUserId, date);

                        return (
                            <div key={date} style={{ width: DAY_COLUMN_WIDTH, minWidth: DAY_COLUMN_WIDTH }}>
                                <ScheduleCell
                                    technicianId={techUserId}
                                    date={date}
                                    schedule={schedule}
                                    isSelected={isSelected}
                                    hasError={cellHasError}
                                    mode={mode}
                                    onClick={onCellClick}
                                    onSelect={onCellSelect}
                                    onDragStart={onDragStart}
                                    onDragOver={onDragOver}
                                />
                            </div>
                        );
                    })}
                </div>
            );
        },
        []
    );

    return (
        <div
            className="border border-border rounded-lg overflow-hidden bg-background"
            onMouseUp={onDragEnd}
            onMouseLeave={onDragEnd}
        >
            <div className="sticky top-0 z-20 bg-muted border-b border-border">
                <div className="flex" style={{ height: HEADER_HEIGHT }}>
                    <div
                        className="sticky left-0 bg-muted border-r border-border flex items-center px-3 z-10"
                        style={{ width: NAME_COLUMN_WIDTH, minWidth: NAME_COLUMN_WIDTH }}
                    >
                        <p className="text-sm font-semibold text-foreground">Tecnico</p>
                    </div>

                    {weekDates.map((date, idx) => {
                        const dateObj = new Date(date);
                        const isToday = date === new Date().toISOString().split('T')[0];

                        return (
                            <div
                                key={date}
                                className={`border-r border-border flex flex-col items-center justify-center ${isToday ? 'bg-primary/10' : ''
                                    }`}
                                style={{ width: DAY_COLUMN_WIDTH, minWidth: DAY_COLUMN_WIDTH }}
                            >
                                <p className="text-xs font-medium text-foreground">{daysOfWeek[idx]}</p>
                                <p className="text-xs text-muted-foreground">
                                    {dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>

            <List
                rowComponent={RowComponent}
                rowCount={technicians.length}
                rowHeight={ROW_HEIGHT}
                rowProps={{
                    technicians,
                    weekDates,
                    daysOfWeek,
                    selectedCells,
                    mode,
                    onCellClick,
                    onCellSelect,
                    onDragStart,
                    onDragOver,
                    getSchedule,
                    hasError,
                }}
                defaultHeight={600}
                overscanCount={5}
                style={{ width: '100%' }}
                ref={listRef as any}
            />
        </div>
    );
}

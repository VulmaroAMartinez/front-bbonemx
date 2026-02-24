import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { WeeklyTemplate } from './types';
import { X, Layers } from 'lucide-react';

interface TemplatePanelProps {
    templates: WeeklyTemplate[];
    onApply: (template: WeeklyTemplate) => void;
    onClose: () => void;
    disabled: boolean;
}

export function TemplatePanel({ templates, onApply, onClose, disabled }: TemplatePanelProps) {
    return (
        <Card className="bg-card border-border">
            <CardContent className="py-3">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-primary" />
                        <p className="text-sm font-medium text-foreground">Plantillas</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {disabled && (
                    <p className="text-xs text-muted-foreground mb-3">
                        Selecciona celdas en la grilla para aplicar una plantilla.
                    </p>
                )}

                <div className="flex flex-wrap gap-2">
                    {templates.map((tpl) => (
                        <Button
                            key={tpl.id}
                            variant="outline"
                            size="sm"
                            disabled={disabled}
                            onClick={() => onApply(tpl)}
                            className="bg-transparent"
                        >
                            <div className="text-left">
                                <p className="text-xs font-medium">{tpl.name}</p>
                                <p className="text-[10px] text-muted-foreground">{tpl.description}</p>
                            </div>
                        </Button>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

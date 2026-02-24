declare module 'react-window' {
    import { ComponentType, CSSProperties, ReactElement } from 'react';

    export interface ListChildComponentProps {
        index: number;
        style: CSSProperties;
        data?: any;
    }

    export interface VariableSizeListProps {
        children: ComponentType<ListChildComponentProps>;
        height: number | string;
        itemCount: number;
        itemSize: (index: number) => number;
        width: number | string;
        overscanCount?: number;
        initialScrollOffset?: number;
        onScroll?: (props: {
            scrollDirection: 'forward' | 'backward';
            scrollOffset: number;
            scrollUpdateWasRequested: boolean;
        }) => void;
    }

    export class VariableSizeList extends ComponentType<VariableSizeListProps> {
        scrollTo(scrollOffset: number): void;
        scrollToItem(index: number, align?: 'start' | 'center' | 'end' | 'smart'): void;
    }
}

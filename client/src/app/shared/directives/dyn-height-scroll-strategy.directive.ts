import { ListRange } from '@angular/cdk/collections';
import { CdkVirtualScrollViewport, VirtualScrollStrategy, VIRTUAL_SCROLL_STRATEGY } from '@angular/cdk/scrolling';
import { ChangeDetectorRef, Directive, ElementRef, forwardRef, Input, OnChanges, SimpleChanges } from '@angular/core';

import { Observable, Subject } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

type ItemHeight = number[];
type Range = [number, number];
const intersects = (a: Range, b: Range): boolean =>
    (a[0] <= b[0] && b[0] <= a[1]) || (a[0] <= b[1] && b[1] <= a[1]) || (b[0] < a[0] && a[1] < b[1]);
const clamp = (min: number, value: number, max: number): number => Math.min(Math.max(min, value), max);
const isEqual = <T>(a: T, b: T) => a === b;
const last = <T>(value: T[]): T => value[value.length - 1];

function factory(dir: DynHeightSctrollDirective): DynHeightScrollStrategy {
    return dir.scrollStrategy;
}

export class DynHeightScrollStrategy implements VirtualScrollStrategy {
    private viewport?: CdkVirtualScrollViewport;
    private scrolledIndexChange$ = new Subject<number>();
    public scrolledIndexChange: Observable<number> = this.scrolledIndexChange$.pipe(distinctUntilChanged());
    public _minBufferPx = 100;
    public _maxBufferPx = 500;

    public constructor(private itemHeights: ItemHeight) {}

    public attach(viewport: CdkVirtualScrollViewport): void {
        this.viewport = viewport;
        this.updateTotalContentSize();
        this.updateRenderedRange();
    }

    public detach(): void {
        this.scrolledIndexChange$.complete();
        delete this.viewport;
    }

    public updateItemHeights(itemHeights: ItemHeight): void {
        this.itemHeights = itemHeights;
        this.updateTotalContentSize();
        this.updateRenderedRange();
    }

    private getItemOffset(index: number): number {
        return this.itemHeights.slice(0, index).reduce((acc, itemHeight) => acc + itemHeight, 0);
    }

    private getTotalContentSize(): number {
        return this.itemHeights.reduce((a, b) => a + b, 0);
    }

    private getListRangeAt(scrollOffset: number, viewportSize: number): ListRange {
        interface Acc {
            itemIndexesInRange: number[];
            currentOffset: number;
        }
        const visibleOffsetRange: Range = [scrollOffset, scrollOffset + viewportSize];
        const itemsInRange = this.itemHeights.reduce<Acc>(
            (acc, itemHeight, index) => {
                const itemOffsetRange: Range = [acc.currentOffset, acc.currentOffset + itemHeight];
                return {
                    currentOffset: acc.currentOffset + itemHeight,
                    itemIndexesInRange: intersects(itemOffsetRange, visibleOffsetRange)
                        ? [...acc.itemIndexesInRange, index]
                        : acc.itemIndexesInRange
                };
            },
            { itemIndexesInRange: [], currentOffset: 0 }
        ).itemIndexesInRange;
        const BUFFER_BEFORE = 5;
        const BUFFER_AFTER = 5;
        return {
            start: clamp(0, (itemsInRange[0] ?? 0) - BUFFER_BEFORE, this.itemHeights.length - 1),
            end: clamp(0, (last(itemsInRange) ?? 0) + BUFFER_AFTER, this.itemHeights.length)
        };
    }

    private updateRenderedRange(): void {
        if (!this.viewport) {
            return;
        }

        const viewportSize = this.viewport.getViewportSize();
        const scrollOffset = this.viewport.measureScrollOffset();
        const newRange = this.getListRangeAt(scrollOffset, viewportSize);
        const oldRange = this.viewport?.getRenderedRange();

        if (isEqual(newRange, oldRange)) {
            return;
        }

        this.viewport.setRenderedRange(newRange);
        this.viewport.setRenderedContentOffset(this.getItemOffset(newRange.start));
        this.scrolledIndexChange$.next(newRange.start);
    }

    private updateTotalContentSize(): void {
        const contentSize = this.getTotalContentSize();
        this.viewport?.setTotalContentSize(contentSize);
    }

    public onContentScrolled(): void {
        this.updateRenderedRange();
    }

    public onDataLengthChanged(): void {
        this.updateTotalContentSize();
        this.updateRenderedRange();
    }

    public onContentRendered(): void {}

    public onRenderedOffsetChanged(): void {}

    public scrollToIndex(index: number, behavior: ScrollBehavior): void {
        this.viewport?.scrollToOffset(this.getItemOffset(index), behavior);
    }
}

/**
 * This enhances cdk-virtual-scroll-viewport no "os" prefix was required here
 * anywhere.
 */
// tslint:disable
@Directive({
    selector: 'cdk-virtual-scroll-viewport[dynHeightScrollStrategy]',
    providers: [
        {
            provide: VIRTUAL_SCROLL_STRATEGY,
            useFactory: factory,
            deps: [forwardRef(() => DynHeightSctrollDirective)]
        }
    ]
})
// tslint:enable
export class DynHeightSctrollDirective implements OnChanges {
    @Input() public itemHeights: ItemHeight = [];

    public scrollStrategy: DynHeightScrollStrategy = new DynHeightScrollStrategy(this.itemHeights);

    public constructor(private elRef: ElementRef, private cd: ChangeDetectorRef) {}

    public ngOnChanges(changes: SimpleChanges): void {
        if ('itemHeights' in changes) {
            this.scrollStrategy.updateItemHeights(this.itemHeights);
            this.cd.detectChanges();
        }
    }
}

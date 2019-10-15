import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, ContentChild, EventEmitter, Input, OnDestroy, OnInit, Output, TemplateRef } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription } from 'rxjs';

import { Selectable } from '../selectable';

/**
 * Reusable Sorting List
 *
 * Use `[input]="listOfSelectables" to pass values
 *
 * ## Examples:
 *
 * ### Usage of the selector:
 *
 * ```html
 * <os-sorting-list
 *     [input]="listOfSelectables"
 *     [live]="true"
 *     [count]="true"
 *     (sortEvent)="onSortingChange($event)">
 * </os-sorting-list>
 * ```
 *
 */
@Component({
    selector: 'os-sorting-list',
    templateUrl: './sorting-list.component.html',
    styleUrls: ['./sorting-list.component.scss']
})
export class SortingListComponent implements OnInit, OnDestroy {
    /**
     * Sorted and returned
     */
    public sortedItems: Selectable[];

    /**
     * The index of multiple selected elements. Allows for multiple items to be
     * selected and then moved
     */
    public multiSelectedIndex: number[] = [];

    /**
     * Declare the templateRef to coexist between parent in child
     */
    @ContentChild(TemplateRef, { static: true })
    public templateRef: TemplateRef<Selectable>;

    /**
     * Set to true if events are directly fired after sorting.
     * usually combined with sortEvent.
     * Prevents the `@input` from resetting the sorting
     *
     * @example
     * ```html
     *  <os-sorting-list ... [live]="true" (sortEvent)="onSortingChange($event)">
     * ```
     */
    @Input()
    public live = false;

    /** Determine whether to put an index number in front of the list */
    @Input()
    public count = false;

    /**
     * Can be set to false to disable drag n drop
     */
    @Input()
    public enable = true;

    /**
     * The Input List Values
     *
     * If live updates are enabled, new values are always converted into the sorting array.
     *
     * If live updates are disabled, new values are processed when the auto update adds
     * or removes relevant objects
     *
     * One can pass the values as an array or an observalbe. If the observable is chosen,
     * every time the observable changes, the array is updated with the rules above.
     */
    @Input()
    public set input(newValues: Selectable[] | Observable<Selectable[]>) {
        if (newValues) {
            if (this.inputSubscription) {
                this.inputSubscription.unsubscribe();
            }
            if (newValues instanceof Observable) {
                this.inputSubscription = newValues.subscribe(values => {
                    this.updateArray(values);
                });
            } else {
                this.inputSubscription = null;
                this.updateArray(newValues);
            }
        }
    }

    /**
     * Saves the subscription, if observables are used. Cleared in the onDestroy hook.
     */
    private inputSubscription: Subscription | null;

    /**
     * Always stores the current items from the last update. Needed for restore and changing between live=true/false
     */
    private currentItems: Selectable[];

    /**
     * Inform the parent view about sorting.
     * Alternative approach to submit a new order of elements
     */
    @Output()
    public sortEvent = new EventEmitter<Selectable[]>();

    /**
     * Constructor for the sorting list.
     *
     * Creates an empty array.
     * @param translate the translation service
     */
    public constructor(protected translate: TranslateService) {
        this.sortedItems = [];
    }

    /**
     * Required by components using the selector as directive
     */
    public ngOnInit(): void {}

    /**
     * Unsubscribe every subscription.
     */
    public ngOnDestroy(): void {
        if (this.inputSubscription) {
            this.inputSubscription.unsubscribe();
        }
    }

    /**
     * Updates the array with the new data. This is called, if the input changes
     *
     * @param newValues The new values to set.
     */
    private updateArray(newValues: Selectable[]): void {
        this.currentItems = newValues.map(val => val);
        if (this.sortedItems.length !== newValues.length || this.live) {
            this.sortedItems = newValues.map(val => val);
        } else {
            this.sortedItems = this.sortedItems.map(arrayValue => newValues.find(val => val.id === arrayValue.id));
        }
    }

    /**
     * Restore the old order from the last update
     */
    public restore(): void {
        this.sortedItems = this.currentItems.map(val => val);
    }

    /**
     * Handles the start of a dragDrop event and clears multiSelect if the ittem dragged
     * is not part of the selected items
     */
    public dragStarted(index: number): void {
        if (this.multiSelectedIndex.length && !this.multiSelectedIndex.includes(index)) {
            this.multiSelectedIndex = [];
        }
    }

    /**
     * drop event
     * @param event the event
     * @param dropBehind (optional) toggle explicit 'insert behind'(true) or
     * 'insert before' (false) behavior instead of relying on a
     * 'natural drop logic'
     */
    public drop(
        event: CdkDragDrop<Selectable[]> | { currentIndex: number; previousIndex: number },
        dropBehind?: boolean
    ): void {
        if (!this.multiSelectedIndex.length) {
            moveItemInArray(this.sortedItems, event.previousIndex, event.currentIndex);
        } else {
            const before: Selectable[] = [];
            const insertions: Selectable[] = [];
            const behind: Selectable[] = [];
            for (let i = 0; i < this.sortedItems.length; i++) {
                if (!this.multiSelectedIndex.includes(i)) {
                    if (i < event.currentIndex) {
                        before.push(this.sortedItems[i]);
                    } else if (i > event.currentIndex) {
                        behind.push(this.sortedItems[i]);
                    } else {
                        if (dropBehind === false) {
                            behind.push(this.sortedItems[i]);
                        } else if (dropBehind === true) {
                            before.push(this.sortedItems[i]);
                        } else {
                            Math.min(...this.multiSelectedIndex) < i
                                ? before.push(this.sortedItems[i])
                                : behind.push(this.sortedItems[i]);
                        }
                    }
                } else {
                    insertions.push(this.sortedItems[i]);
                }
            }
            this.sortedItems = [...before, ...insertions, ...behind];
        }
        this.sortEvent.emit(this.sortedItems);
        this.multiSelectedIndex = [];
    }

    /**
     * Handles a click on a row. If the control key is clicked, the element is
     * added/removed from a multiselect list /(which will be handled on
     * dropping)
     *
     * @param event MouseEvent.
     * @param indx The index of the row clicked.
     */
    public onItemClick(event: MouseEvent, indx: number): void {
        if (event.ctrlKey) {
            const ind = this.multiSelectedIndex.findIndex(i => i === indx);
            if (ind === -1) {
                this.multiSelectedIndex.push(indx);
            } else {
                this.multiSelectedIndex = this.multiSelectedIndex
                    .slice(0, ind)
                    .concat(this.multiSelectedIndex.slice(ind + 1));
            }
        } else {
            // deselect all when clicking on an non-selected item
            if (this.multiSelectedIndex.length && !this.multiSelectedIndex.includes(indx)) {
                this.multiSelectedIndex = [];
            }
        }
    }

    /**
     * Checks if the row at the given index is currently selected
     *
     * @param index
     * @returns true if the item is currently selected
     */
    public isSelectedRow(index: number): boolean {
        return this.multiSelectedIndex.includes(index);
    }
}

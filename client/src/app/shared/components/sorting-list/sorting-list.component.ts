import { Component, OnInit, Input, Output, EventEmitter, ContentChild, TemplateRef } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Selectable } from '../selectable';
import { EmptySelectable } from '../empty-selectable';

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
export class SortingListComponent implements OnInit {
    /**
     * Sorted and returned
     */
    public array: Array<Selectable>;

    /**
     * Declare the templateRef to coexist between parent in child
     */
    @ContentChild(TemplateRef)
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
     * The Input List Values
     *
     * If live updates are enabled, new values are always converted into the sorting array.
     *
     * If live updates are disabled, new values are processed when the auto update adds
     * or removes relevant objects
     */
    @Input()
    public set input(newValues: Array<Selectable>) {
        if (newValues) {
            if (this.array.length !== newValues.length || this.live) {
                this.array = [];
                this.array = newValues.map(val => val);
            } else if (this.array.length === 0) {
                this.array.push(new EmptySelectable(this.translate));
            }
        }
    }

    /**
     * Inform the parent view about sorting.
     * Alternative approach to submit a new order of elements
     */
    @Output()
    public sortEvent = new EventEmitter<Array<Selectable>>();

    /**
     * Constructor for the sorting list.
     *
     * Creates an empty array.
     * @param translate the translation service
     */
    public constructor(public translate: TranslateService) {
        this.array = [];
    }

    /**
     * Required by components using the selector as directive
     */
    public ngOnInit(): void {}

    /**
     * drop event
     * @param event the event
     */
    public drop(event: CdkDragDrop<Selectable[]>): void {
        moveItemInArray(this.array, event.previousIndex, event.currentIndex);
        this.sortEvent.emit(this.array);
    }
}

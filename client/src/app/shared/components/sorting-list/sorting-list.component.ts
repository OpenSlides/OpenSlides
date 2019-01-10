import { Component, OnInit, Input, Output, EventEmitter, ContentChild, TemplateRef, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Selectable } from '../selectable';
import { EmptySelectable } from '../empty-selectable';
import { Observable, Subscription } from 'rxjs';

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
    public constructor(public translate: TranslateService) {
        this.array = [];
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
        if (this.array.length !== newValues.length || this.live) {
            this.array = [];
            this.array = newValues.map(val => val);
            console.log(newValues);
        } else if (this.array.length === 0) {
            this.array.push(new EmptySelectable(this.translate));
        }
    }

    /**
     * drop event
     * @param event the event
     */
    public drop(event: CdkDragDrop<Selectable[]>): void {
        moveItemInArray(this.array, event.previousIndex, event.currentIndex);
        this.sortEvent.emit(this.array);
    }
}

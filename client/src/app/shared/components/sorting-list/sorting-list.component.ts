import { Component, OnInit, Input } from '@angular/core';
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
 *   [input]="listOfSelectables">
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
     * The Input List Values
     */
    @Input()
    public input: Array<Selectable>;

    public array: Array<Selectable>;

    /**
     * Empty constructor
     */
    public constructor(public translate: TranslateService) {}

    public ngOnInit(): void {
        this.array = [];
        if (this.input) {
            this.input.forEach(inputElement => {
                this.array.push(inputElement);
            });
        } else {
            this.array.push(new EmptySelectable(this.translate));
        }
    }

    /**
     * drop event
     * @param event the event
     */
    public drop(event: CdkDragDrop<Selectable[]>): void {
        moveItemInArray(this.array, event.previousIndex, event.currentIndex);
    }
}

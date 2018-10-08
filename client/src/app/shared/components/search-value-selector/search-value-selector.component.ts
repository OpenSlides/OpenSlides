import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Subject, ReplaySubject, BehaviorSubject } from 'rxjs';
import { MatSelect } from '@angular/material';
import { takeUntil } from 'rxjs/operators';
import { Displayable } from '../../models/base/displayable';
import { TranslateService } from '@ngx-translate/core';
import { Identifiable } from '../../models/base/identifiable';

export type Selectable = Displayable & Identifiable;

/**
 * Reusable Searchable Value Selector
 *
 * Use `multiple="true"`, `[InputListValues]=myValues`,`[formControl]="myformcontrol"`, `[form]="myform_name"` and `placeholder={{listname}}` to pass the Values and Listname
 *
 * ## Examples:
 *
 * ### Usage of the selector:
 *
 * ngDefaultControl: https://stackoverflow.com/a/39053470
 *
 * ```html
 * <os-search-value-selector
 *   ngDefaultControl
 *   [multiple]="true"
 *   placeholder="Placeholder"
 *   [InputListValues]="myListValues",
 *   [form]="myform_name",
 *   [formControl]="myformcontrol">
 * </os-search-value-selector>
 * ```
 *
 */

@Component({
    selector: 'os-search-value-selector',
    templateUrl: './search-value-selector.component.html',
    styleUrls: ['./search-value-selector.component.scss']
})
export class SearchValueSelectorComponent implements OnInit {
    /**
     * ngModel variable - Deprecated with Angular 7
     * DO NOT USE: READ AT remove() FUNCTION!
     */
    public myModel = [];

    /**
     * Control for the filtering of the list
     */
    public filterControl = new FormControl();

    /**
     * List of the filtered content, when entering something in the search bar
     */
    public filteredItems: ReplaySubject<Selectable[]> = new ReplaySubject<Selectable[]>(1);

    /**
     * Decide if this should be a single or multi-select-field
     */
    @Input()
    public multiple: boolean;

    /**
     * The Input List Values
     */
    @Input()
    public InputListValues: BehaviorSubject<Selectable[]>;

    /**
     * Placeholder of the List
     */
    @Input()
    public listname: String;

    /**
     * Form Group
     */
    @Input()
    public form: FormGroup;

    /**
     * Name of the Form
     */
    @Input()
    public formControl: FormControl;

    /**
     * DO NOT USE UNTIL BUG IN UPSTREAM ARE RESOLVED!
     * READ AT FUNCTION remove()
     *
     * Displayes the selected Items as Chip-List
     */
    // @Input()
    public dispSelected = false;

    /**
     * The MultiSelect Component
     */
    @ViewChild('thisSelector')
    public thisSelector: MatSelect;

    /**
     * Subject that emits when the component has been destroyed
     */
    private _onDestroy = new Subject<void>();

    /**
     * Empty constructor
     */
    public constructor(public translate: TranslateService) {}

    /**
     * onInit with filter ans subscription on filter
     */
    public ngOnInit(): void {
        this.filteredItems.next(this.InputListValues.getValue());
        // listen to value changes
        this.filterControl.valueChanges.pipe(takeUntil(this._onDestroy)).subscribe(() => {
            this.filterItems();
        });
    }

    /**
     * the filter function itself
     */
    private filterItems(): void {
        if (!this.InputListValues) {
            return;
        }
        // get the search keyword
        let search = this.filterControl.value;
        if (!search) {
            this.filteredItems.next(this.InputListValues.getValue());
            return;
        } else {
            search = search.toLowerCase();
        }
        // filter the values
        this.filteredItems.next(
            this.InputListValues.getValue().filter(
                selectedItem =>
                    selectedItem
                        .toString()
                        .toLowerCase()
                        .indexOf(search) > -1
            )
        );
    }

    /**
     * If the dispSelected value is marked as true, a chipList should be shown below the
     * selection list. Unfortunately it is not possible (yet) to change the datamodel in the backend
     * https://github.com/angular/material2/issues/10085 - therefore you can display the values in two
     * places, but can't reflect the changes in both places. Until this can be done this will be unused code
     * @param item the selected item to be removed
     */
    public remove(item: Selectable): void {
        const myArr = this.thisSelector.value;
        const index = myArr.indexOf(item, 0);
        // my model was the form according to fix
        // https://github.com/angular/material2/issues/10044
        // but this causes bad behaviour and will be depricated in Angular 7
        this.myModel = this.myModel.slice(index, 1);
        if (index > -1) {
            myArr.splice(index, 1);
        }
        this.thisSelector.value = myArr;
    }
}

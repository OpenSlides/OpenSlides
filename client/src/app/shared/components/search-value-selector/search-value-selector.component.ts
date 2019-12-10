import { ChangeDetectionStrategy, Component, Input, OnDestroy, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSelect } from '@angular/material';

import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription } from 'rxjs';
import { auditTime } from 'rxjs/operators';

import { Selectable } from '../selectable';

/**
 * Reusable Searchable Value Selector
 *
 * Use `multiple="true"`, `[InputListValues]=myValues`,`[formControl]="myformcontrol"` and `placeholder={{listname}}` to pass the Values and Listname
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
 *   [InputListValues]="myListValues"
 *   [formControl]="myformcontrol">
 * </os-search-value-selector>
 * ```
 *
 */

@Component({
    selector: 'os-search-value-selector',
    templateUrl: './search-value-selector.component.html',
    styleUrls: ['./search-value-selector.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchValueSelectorComponent implements OnDestroy {
    /**
     * Saves the current subscription to _inputListSubject.
     */
    private _inputListSubscription: Subscription = null;

    /**
     * Value of the search input
     */
    private searchValue = '';

    /**
     * All items
     */
    private selectableItems: Selectable[];

    /**
     * Decide if this should be a single or multi-select-field
     */
    @Input()
    public multiple = false;

    /**
     * Decide, if none should be included, if multiple is false.
     */
    @Input()
    public includeNone = false;

    @Input()
    public noneTitle = '–';

    /**
     * Boolean, whether the component should be rendered with full width.
     */
    @Input()
    public fullWidth = false;

    /**
     * The inputlist subject. Subscribes to it and updates the selector, if the subject
     * changes its values.
     */
    @Input()
    public set inputListValues(value: Selectable[] | Observable<Selectable[]>) {
        if (!value) {
            return;
        }

        if (Array.isArray(value)) {
            this.selectableItems = value;
        } else {
            // unsubscribe to old subscription.
            if (this._inputListSubscription) {
                this._inputListSubscription.unsubscribe();
            }
            this._inputListSubscription = value.pipe(auditTime(10)).subscribe(items => {
                this.selectableItems = items;
                if (this.formControl) {
                    !!items && items.length > 0
                        ? this.formControl.enable({ emitEvent: false })
                        : this.formControl.disable({ emitEvent: false });
                }
            });
        }
    }

    /**
     * Placeholder of the List
     */
    @Input()
    public listname: string;

    /**
     * Name of the Form
     */
    @Input()
    public formControl: FormControl;

    /**
     * The MultiSelect Component
     */
    @ViewChild('thisSelector', { static: true })
    public thisSelector: MatSelect;

    /**
     * Empty constructor
     */
    public constructor(protected translate: TranslateService) {}

    /**
     * Unsubscribe on destroing.
     */
    public ngOnDestroy(): void {
        if (this._inputListSubscription) {
            this._inputListSubscription.unsubscribe();
        }
    }

    /**
     * Function to get a list filtered by the entered search value.
     *
     * @returns The filtered list of items.
     */
    public getFilteredItems(): Selectable[] {
        if (this.selectableItems) {
            return this.selectableItems.filter(item => {
                const idString = '' + item.id;
                const foundId =
                    idString
                        .trim()
                        .toLowerCase()
                        .indexOf(this.searchValue) !== -1;

                if (foundId) {
                    return true;
                }
                const searchableString = this.translate.instant(item.getTitle()).toLowerCase();
                return searchableString.indexOf(this.searchValue) > -1;
            });
        }
    }

    /**
     * Function to set the search value.
     *
     * @param searchValue the new value the user is searching for.
     */
    public onSearch(searchValue: string): void {
        this.searchValue = searchValue.toLowerCase();
    }
}

import { FocusMonitor } from '@angular/cdk/a11y';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    Optional,
    Output,
    Self,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import { FormBuilder, FormControl, NgControl } from '@angular/forms';
import { MatOptionSelectionChange } from '@angular/material/core';
import { MatFormFieldControl } from '@angular/material/form-field';

import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { auditTime } from 'rxjs/operators';

import { BaseFormControlComponentDirective } from 'app/shared/models/base/base-form-control';
import { Identifiable } from 'app/shared/models/base/identifiable';
import { ParentErrorStateMatcher } from 'app/shared/parent-error-state-matcher';
import { Selectable } from '../selectable';

/**
 * Searchable Value Selector
 *
 * Use `multiple="true"`, `[inputListValues]=myValues`,`formControlName="myformcontrol"` and
 * `placeholder={{listname}}` to pass the Values and Listname
 *
 * ## Examples:
 *
 * ### Usage of the selector:
 *
 * ```html
 * <os-search-value-selector
 *   [multiple]="true"
 *   placeholder="Placeholder"
 *   [inputListValues]="myListValues"
 *   formControlName="myformcontrol">
 * </os-search-value-selector>
 * ```
 *
 */

@Component({
    selector: 'os-search-value-selector',
    templateUrl: './search-value-selector.component.html',
    styleUrls: ['./search-value-selector.component.scss'],
    providers: [{ provide: MatFormFieldControl, useExisting: SearchValueSelectorComponent }],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchValueSelectorComponent extends BaseFormControlComponentDirective<Selectable[]> {
    @ViewChild(CdkVirtualScrollViewport, { static: true })
    public cdkVirtualScrollViewPort: CdkVirtualScrollViewport;

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
    public showChips = true;

    @Input()
    public noneTitle = '–';

    @Input()
    public errorStateMatcher: ParentErrorStateMatcher;

    /**
     * Whether to show a button, if there is no matching option.
     */
    @Input()
    public showNotFoundButton = false;

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
            this.subscriptions.push(
                value.pipe(auditTime(10)).subscribe(items => {
                    this.selectableItems = items;
                    if (this.contentForm) {
                        this.disabled = !items || (!!items && !items.length);
                    }
                })
            );
        }
    }

    /**
     * Emits the currently searched string.
     */
    @Output()
    public clickNotFound = new EventEmitter<string>();

    public searchValue: FormControl;

    public get empty(): boolean {
        return Array.isArray(this.contentForm.value) ? !this.contentForm.value.length : !this.contentForm.value;
    }

    public get selectedItems(): Selectable[] {
        if (this.multiple && this.selectableItems?.length && this.contentForm.value) {
            return this.selectableItems.filter(item => {
                return this.contentForm.value.includes(item.id);
            });
        }
        return [];
    }

    public controlType = 'search-value-selector';

    /**
     * All items
     */
    private selectableItems: Selectable[];

    public selectedIds: number[] = [];

    public constructor(
        protected translate: TranslateService,
        formBuilder: FormBuilder,
        @Optional() @Self() public ngControl: NgControl,
        focusMonitor: FocusMonitor,
        element: ElementRef<HTMLElement>
    ) {
        super(formBuilder, focusMonitor, element, ngControl);
    }

    public openSelect(event: boolean): void {
        if (event) {
            this.cdkVirtualScrollViewPort.scrollToIndex(0);
            this.cdkVirtualScrollViewPort.checkViewportSize();
        }
    }

    /**
     * Function to get a list filtered by the entered search value.
     *
     * @returns The filtered list of items.
     */
    public getFilteredItems(): Selectable[] {
        if (this.selectableItems) {
            const searchValue: string = this.searchValue.value.toLowerCase();
            return this.selectableItems.filter(item => {
                const idString = '' + item.id;
                const foundId = idString.trim().toLowerCase().indexOf(searchValue) !== -1;

                if (foundId) {
                    return true;
                }

                return item.toString().toLowerCase().indexOf(searchValue) > -1;
            });
        } else {
            return [];
        }
    }

    public removeChipItem(item: Selectable): void {
        this.addRemoveId(item.id);
    }

    private addRemoveId(item: number): void {
        const idx = this.selectedIds.indexOf(item);
        if (idx > -1) {
            this.selectedIds.splice(idx, 1);
        } else {
            this.selectedIds.push(item);
        }
        this.contentForm.setValue(this.selectedIds);
    }

    public onSelectionChange(change: MatOptionSelectionChange): void {
        if (this.multiple && change.isUserInput) {
            const value = change.source.value;
            this.addRemoveId(value);
        }
    }

    /**
     * Satisfy parent
     */
    public onContainerClick(event: MouseEvent): void {
        if ((event.target as Element).tagName.toLowerCase() !== 'select') {
            // this.element.nativeElement.querySelector('select').focus();
        }
    }

    /**
     * Emits the click on 'notFound' and resets the search-value.
     */
    public onNotFoundClick(): void {
        this.clickNotFound.emit(this.searchValue.value);
        this.searchValue.setValue('');
    }

    protected initializeForm(): void {
        this.contentForm = this.fb.control([]);
        this.searchValue = this.fb.control('');
    }

    protected updateForm(value: Selectable[] | null): void {
        this.contentForm.setValue(value);
        if (value?.length) {
            /**
             * Hack:
             * for loaded or preselected form, add existing values to selected IDs.
             * These are usually always numbers,
             * Would be easier to absolutely always use Selectable and never use IDs,
             * Could save some work, but every second form has to change for that.
             * -> os4 todo
             */
            this.selectedIds = value as any;
        }
    }
}

import { FocusMonitor } from '@angular/cdk/a11y';
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
import { MatFormFieldControl } from '@angular/material/form-field';

import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { auditTime } from 'rxjs/operators';

import { BaseFormControlComponentDirective } from 'app/shared/models/base/base-form-control';
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
    @ViewChild('chipPlaceholder', { static: false })
    public chipPlaceholder: ElementRef<HTMLElement>;

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
        return this.selectableItems && this.contentForm.value
            ? this.selectableItems.filter(item => this.contentForm.value.includes(item.id))
            : [];
    }

    public controlType = 'search-value-selector';

    public get width(): string {
        return this.chipPlaceholder ? `${this.chipPlaceholder.nativeElement.clientWidth - 16}px` : '100%';
    }

    /**
     * All items
     */
    private selectableItems: Selectable[];

    public constructor(
        protected translate: TranslateService,
        formBuilder: FormBuilder,
        @Optional() @Self() public ngControl: NgControl,
        focusMonitor: FocusMonitor,
        element: ElementRef<HTMLElement>
    ) {
        super(formBuilder, focusMonitor, element, ngControl);
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

    public removeItem(itemId: number): void {
        const items = <number[]>this.contentForm.value;
        items.splice(
            items.findIndex(item => item === itemId),
            1
        );
        this.contentForm.setValue(items);
    }

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
    }
}

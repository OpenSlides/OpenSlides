import { Component, EventEmitter, HostListener, Input, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';

import { TranslateService } from '@ngx-translate/core';

import { BaseFilterListService, OsFilterIndicator } from 'app/core/ui-services/base-filter-list.service';
import { BaseSortListService } from 'app/core/ui-services/base-sort-list.service';
import { OsSortingOption } from 'app/core/ui-services/base-sort.service';
import { ViewportService } from 'app/core/ui-services/viewport.service';
import { BaseViewModel } from 'app/site/base/base-view-model';
import { FilterMenuComponent } from './filter-menu/filter-menu.component';
import { RoundedInputComponent } from '../rounded-input/rounded-input.component';
import { SortBottomSheetComponent } from './sort-bottom-sheet/sort-bottom-sheet.component';

/**
 * Reusable bar for list views, offering sorting and filter options.
 * It will modify the DataSource of the listView to include custom sorting and
 * filters.
 *
 * ## Examples:
 * ### Usage of the selector:
 *
 * ```html
 * <os-sort-filter-bar [sortService]="sortService" [filterService]="filterService"
 * (searchFieldChange)="searchFilter($event)" [filterCount]="filteredCount">
 * </os-sort-filter-bar>
 * ```
 */
@Component({
    selector: 'os-sort-filter-bar',
    templateUrl: './sort-filter-bar.component.html',
    styleUrls: ['./sort-filter-bar.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class SortFilterBarComponent<V extends BaseViewModel> {
    @ViewChild('searchField', { static: true })
    public searchField: RoundedInputComponent;

    /**
     * The currently active sorting service for the list view
     */
    @Input()
    public sortService: BaseSortListService<V>;

    /** Optional number to overwrite the display of the filtered data count, if any additional filters
     * (e.g. the angular search bar) are applied on top of these filters
     */
    @Input()
    public filterCount: number;

    /**
     * The currently active filter service for the list view. It is supposed to
     * be a FilterListService extendingFilterListService.
     */
    @Input()
    public filterService: BaseFilterListService<V>;

    /**
     * Optional string to tell the verbose name of the filtered items. This string is displayed,
     * if no filter service is given.
     */
    @Input()
    public itemsVerboseName: string;

    /**
     * Custom input for the search-field.
     * Used to change the value of the input from outside of this component.
     */
    @Input()
    public searchFieldInput: string;

    /**
     * EventEmitter to emit the next search-value.
     */
    @Output()
    public searchFieldChange = new EventEmitter<string>();

    /**
     * The filter side drawer
     */
    @ViewChild('filterMenu', { static: true })
    public filterMenu: FilterMenuComponent;

    /**
     * The bottom sheet used to alter sorting in mobile view
     */
    @ViewChild('sortBottomSheet')
    public sortBottomSheet: SortBottomSheetComponent<V>;

    /**
     * Optional boolean, whether the filter and sort service should be shown.
     */
    private _showFilterSort = true;

    /**
     * Holds the total amount of data.
     */
    private _totalCount: number;

    /**
     * Setter for `showFilterSort`
     */
    @Input()
    public set showFilterSort(show: boolean) {
        this._showFilterSort = show;
    }

    /**
     * Getter for `showFilterSort`
     */
    public get showFilterSort(): boolean {
        return this._showFilterSort;
    }

    /**
     * Overwrites the total-count. If there is no filter-service set, this is used by default.
     */
    @Input()
    public set totalCount(count: number) {
        this._totalCount = count;
    }

    /**
     * Return the total count of potential filters
     */
    public get totalCount(): number {
        return this.filterService ? this.filterService.unfilteredCount : this._totalCount;
    }

    public get sortOptions(): any {
        return this.sortService.sortOptions;
    }

    public get filterAmount(): number {
        if (this.filterService) {
            const filterCount = this.filterService.filterCount;
            return !!filterCount ? filterCount : null;
        }
    }

    public set sortOption(option: OsSortingOption<V>) {
        // If the option has a custom sorting function
        this.sortService.sortFn = option.sortFn || null;
        this.sortService.sortProperty = option.property;
    }

    /**
     * Constructor. Also creates a filtermenu component and a bottomSheet
     * @param translate
     * @param vp
     * @param bottomSheet
     */
    public constructor(
        protected translate: TranslateService,
        public vp: ViewportService,
        private bottomSheet: MatBottomSheet
    ) {
        this.filterMenu = new FilterMenuComponent();
    }

    /**
     * on Click, remove Filter
     * @param filter
     */
    public removeFilterFromStack(filter: OsFilterIndicator): void {
        this.filterService.toggleFilterOption(filter.property, filter.option);
    }

    /**
     * Clear all filters
     */
    public onClearAllButton(event: MouseEvent): void {
        event.stopPropagation();
        this.filterService.clearAllFilters();
    }

    /**
     * Handles the sorting menu/bottom sheet (depending on state of mobile/desktop)
     */
    public openSortDropDown(): void {
        if (this.vp.isMobile) {
            const bottomSheetRef = this.bottomSheet.open(SortBottomSheetComponent, { data: this.sortService });
            bottomSheetRef.afterDismissed().subscribe(result => {
                if (result) {
                    this.sortService.sortProperty = result;
                }
            });
        }
    }

    /**
     * Checks if there is an active SortService present
     */
    public get hasSorting(): boolean {
        return this.sortService && this.sortService.isActive;
    }

    /**
     * Checks if there is an active FilterService present
     * @returns wether the filters are present or not
     */
    public get hasFilters(): boolean {
        return this.filterService && this.filterService.hasFilterOptions;
    }

    /**
     * Retrieves the currently active icon for an option.
     * @param option
     */
    public getSortIcon(option: OsSortingOption<V>): string | null {
        const icon = this.sortService.getSortIcon(option);
        return icon ? icon : null;
    }

    /**
     * Gets the label for anoption. If no label is defined, a capitalized version of
     * the property is used.
     * @param option
     */
    public getSortLabel(option: OsSortingOption<V>): string {
        if (option.label) {
            return option.label;
        }
        const itemProperty = option.property as string;
        return itemProperty.charAt(0).toUpperCase() + itemProperty.slice(1);
    }

    @HostListener('document:keydown', ['$event']) public onKeyDown(event: KeyboardEvent): void {
        if (event.ctrlKey && event.key === 'f') {
            event.preventDefault();
            event.stopPropagation();
            this.searchField.focus();
        }
    }
}

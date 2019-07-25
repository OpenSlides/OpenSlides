import { Input, Output, Component, ViewChild, EventEmitter, ViewEncapsulation } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';

import { TranslateService } from '@ngx-translate/core';

import { BaseViewModel } from 'app/site/base/base-view-model';
import { SortBottomSheetComponent } from './sort-bottom-sheet/sort-bottom-sheet.component';
import { FilterMenuComponent } from './filter-menu/filter-menu.component';
import { OsSortingOption } from 'app/core/ui-services/base-sort-list.service';
import { BaseSortListService } from 'app/core/ui-services/base-sort-list.service';
import { ViewportService } from 'app/core/ui-services/viewport.service';
import { BaseFilterListService, OsFilterIndicator } from 'app/core/ui-services/base-filter-list.service';

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
     * optional additional string to show after the item count. This string will not be translated here
     */
    @Input()
    public extraItemInfo: string;

    /**
     * Optional string to tell the verbose name of the filtered items. This string is displayed, if no filter service is given.
     */
    @Input()
    public itemsVerboseName: string;

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
    @ViewChild('sortBottomSheet', { static: false })
    public sortBottomSheet: SortBottomSheetComponent<V>;

    /**
     * Optional boolean, whether the filter and sort service should be shown.
     */
    private _showFilterSort = true;

    /**
     * The 'opened/active' state of the fulltext filter input field
     */
    public isSearchBar = false;

    /**
     * Return the amount of data passing filters. Priorizes the override in {@link filterCount} over
     * the information from the filterService
     */
    public get displayedCount(): number {
        if (this.filterCount === undefined || this.filterCount === null) {
            return this.filterService.filteredCount;
        } else {
            return this.filterCount;
        }
    }

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
     * Return the total count of potential filters
     */
    public get totalCount(): number {
        return this.filterService.unfilteredCount;
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
     * Listen to keypresses on the quick-search input
     */
    public applySearch(event: KeyboardEvent, value?: string): void {
        if (event.key === 'Escape') {
            this.searchFieldChange.emit('');
            this.isSearchBar = false;
        } else {
            this.searchFieldChange.emit(value);
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
    public getSortIcon(option: OsSortingOption<V>): string {
        return this.sortService.getSortIcon(option);
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

    /**
     * Open/closes the 'quick search input'. When closing, also removes the filter
     * that input applied
     */
    public toggleSearchBar(): void {
        if (!this.isSearchBar) {
            this.isSearchBar = true;
        } else {
            this.searchFieldChange.emit('');
            this.isSearchBar = false;
        }
    }
}

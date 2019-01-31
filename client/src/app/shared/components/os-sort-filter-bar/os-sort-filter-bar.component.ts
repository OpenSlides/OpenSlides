import { Input, Output, Component, ViewChild, EventEmitter } from '@angular/core';
import { MatBottomSheet } from '@angular/material';

import { TranslateService } from '@ngx-translate/core';

import { BaseViewModel } from '../../../site/base/base-view-model';
import { OsSortBottomSheetComponent } from './os-sort-bottom-sheet/os-sort-bottom-sheet.component';
import { FilterMenuComponent } from './filter-menu/filter-menu.component';
import { OsSortingItem } from '../../../core/services/sort-list.service';
import { SortListService } from '../../../core/services/sort-list.service';
import { ViewportService } from '../../../core/services/viewport.service';

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
    templateUrl: './os-sort-filter-bar.component.html',
    styleUrls: ['./os-sort-filter-bar.component.scss']
})
export class OsSortFilterBarComponent<V extends BaseViewModel> {
    /**
     * The currently active sorting service for the list view
     */
    @Input()
    public sortService: SortListService<V>;

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
    public filterService: any; // TODO a FilterListService extending FilterListService

    @Output()
    public searchFieldChange = new EventEmitter<string>();
    /**
     * The filter side drawer
     */
    @ViewChild('filterMenu')
    public filterMenu: FilterMenuComponent;

    /**
     * The bottom sheet used to alter sorting in mobile view
     */
    @ViewChild('sortBottomSheet')
    public sortBottomSheet: OsSortBottomSheetComponent<V>;

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
            return this.filterService.filterCount;
        } else {
            return this.filterCount;
        }
    }

    /**
     * Constructor. Also creates a filtermenu component and a bottomSheet
     * @param translate
     * @param vp
     * @param bottomSheet
     */
    public constructor(
        public translate: TranslateService,
        public vp: ViewportService,
        private bottomSheet: MatBottomSheet
    ) {
        this.filterMenu = new FilterMenuComponent();
    }

    /**
     * Handles the sorting menu/bottom sheet (depending on state of mobile/desktop)
     */
    public openSortDropDown(): void {
        if (this.vp.isMobile) {
            const bottomSheetRef = this.bottomSheet.open(OsSortBottomSheetComponent, { data: this.sortService });
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
     */
    public get hasFilters(): boolean {
        if (this.filterService && this.filterService.hasFilterOptions) {
            return true;
        }
        return false;
    }

    /**
     * Retrieves the currently active icon for an option.
     * @param option
     */
    public getSortIcon(option: OsSortingItem<V>): string {
        if (this.sortService.sortProperty !== option.property) {
            return '';
        }
        return this.sortService.ascending ? 'arrow_downward' : 'arrow_upward';
    }

    /**
     * Gets the label for anoption. If no label is defined, a capitalized version of
     * the property is used.
     * @param option
     */
    public getSortLabel(option: OsSortingItem<V>): string {
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

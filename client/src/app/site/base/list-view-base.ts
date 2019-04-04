import { MatTableDataSource, MatTable, MatSort, MatPaginator, MatSnackBar, PageEvent } from '@angular/material';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { ViewChild, Type, OnDestroy } from '@angular/core';

import { BaseViewComponent } from './base-view';
import { BaseViewModel } from './base-view-model';
import { BaseSortListService } from 'app/core/ui-services/base-sort-list.service';
import { BaseFilterListService } from 'app/core/ui-services/base-filter-list.service';
import { BaseModel } from 'app/shared/models/base/base-model';
import { ActivatedRoute } from '@angular/router';
import { StorageService } from 'app/core/core-services/storage.service';

export abstract class ListViewBaseComponent<V extends BaseViewModel, M extends BaseModel> extends BaseViewComponent
    implements OnDestroy {
    /**
     * The data source for a table. Requires to be initialized with a BaseViewModel
     */
    public dataSource: MatTableDataSource<V>;

    /**
     * Toggle for enabling the multiSelect mode. Defaults to false (inactive)
     */
    protected canMultiSelect = false;

    /**
     * Current state of the multi select mode. TODO Could be merged with edit mode?
     */
    private _multiSelectMode = false;

    /**
     * An array of currently selected items, upon which multi select actions can be performed
     * see {@link selectItem}.
     */
    public selectedRows: V[];

    /**
     * Holds the key for the storage.
     * This is by default the component's name.
     */
    private paginationStorageKey: string;

    /**
     * Holds the value from local storage with the 'Paginator' key.
     */
    private paginationStorageObject: { [key: string]: number };

    /**
     * Determine the default page size of paginated list views
     */
    public pageSize = [50, 100, 150, 200, 250];

    /**
     * The table itself
     */
    @ViewChild(MatTable)
    protected table: MatTable<V>;

    /**
     * Table paginator
     */
    @ViewChild(MatPaginator)
    protected paginator: MatPaginator;

    /**
     * Sorter for a table
     */
    @ViewChild(MatSort)
    protected sort: MatSort;

    /**
     * @returns the amount of currently dispalyed items (only showing items that pass all filters)
     */
    public get filteredCount(): number {
        return this.dataSource.filteredData.length;
    }

    /**
     * Constructor for list view bases
     * @param titleService the title serivce
     * @param translate the translate service
     * @param matSnackBar showing errors
     * @param filterService filter
     * @param sortService sorting
     */
    public constructor(
        titleService: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        protected route?: ActivatedRoute,
        protected storage?: StorageService,
        public filterService?: BaseFilterListService<M, V>,
        public sortService?: BaseSortListService<V>
    ) {
        super(titleService, translate, matSnackBar);
        this.selectedRows = [];
        try {
            this.paginationStorageKey = (<Type<any>>route.component).name;
        } catch (e) {
            this.paginationStorageKey = '';
        }
    }

    /**
     * Children need to call this in their init-function.
     * Calling these three functions in the constructor of this class
     * would be too early, resulting in non-paginated tables
     */
    public initTable(): void {
        this.dataSource = new MatTableDataSource();
        this.dataSource.paginator = this.paginator;
        // Set the initial page settings.
        if (this.dataSource.paginator) {
            this.initializePagination();
            this.dataSource.paginator._intl.itemsPerPageLabel = this.translate.instant('items per page');
        }
        if (this.filterService) {
            this.onFilter();
        }
        if (this.sortService) {
            this.onSort();
        }
    }

    /**
     * Standard filtering function. Sufficient for most list views but can be overwritten
     */
    protected onFilter(): void {
        if (this.sortService) {
            this.subscriptions.push(
                this.filterService.filter().subscribe(filteredData => (this.sortService.data = filteredData))
            );
        } else {
            this.filterService.filter().subscribe(filteredData => (this.dataSource.data = filteredData));
        }
    }

    /**
     * Standard sorting function. Sufficient for most list views but can be overwritten
     */
    protected onSort(): void {
        this.subscriptions.push(
            this.sortService.sort().subscribe(sortedData => {
                // the dataArray needs to be cleared (since angular 7)
                // changes are not detected properly anymore
                this.dataSource.data = [];
                this.dataSource.data = sortedData;
                this.checkSelection();
            })
        );
    }

    public onSortButton(itemProperty: string): void {
        let newOrder: 'asc' | 'desc' = 'asc';
        if (itemProperty === this.sort.active) {
            newOrder = this.sort.direction === 'asc' ? 'desc' : 'asc';
        }
        const newSort = {
            disableClear: true,
            id: itemProperty,
            start: newOrder
        };
        this.sort.sort(newSort);
    }

    public onFilterData(filteredDataSource: MatTableDataSource<V>): void {
        this.dataSource = filteredDataSource;
        this.dataSource.paginator = this.paginator;
    }

    public searchFilter(event: string): void {
        this.dataSource.filter = event;
    }

    /**
     * Initialize the settings for the paginator in every list view.
     */
    private async initializePagination(): Promise<void> {
        // If the storage is not available - like in history mode - do nothing.
        if (this.storage) {
            this.paginationStorageObject = (await this.storage.get('Pagination')) || {};
            // Set the number of items per page -- by default to 25.
            this.paginator.pageSize = this.paginationStorageObject[this.paginationStorageKey] || 25;
            // Subscription to page change events, like size, index.
            this.subscriptions.push(
                this.paginator.page.subscribe((event: PageEvent) => {
                    this.setPageSettings(event.pageSize);
                })
            );
        }
    }

    /**
     * Function to set the new selected page size in the browser's local storage.
     *
     * @param size is the new page size.
     */
    public async setPageSettings(size: number): Promise<void> {
        if (this.paginationStorageObject) {
            this.paginationStorageObject[this.paginationStorageKey] = size;
            await this.storage.set('Pagination', this.paginationStorageObject);
        }
    }

    /**
     * Default click action on selecting an item. In multiselect modus,
     * this just adds/removes from a selection, else it performs a {@link singleSelectAction}
     * @param row The clicked row's {@link ViewModel}
     * @param event The Mouse event
     */
    public selectItem(row: V, event: MouseEvent): void {
        if (this.isMultiSelect) {
            event.stopPropagation();
            const idx = this.selectedRows.indexOf(row);
            if (idx < 0) {
                this.selectedRows.push(row);
            } else {
                this.selectedRows.splice(idx, 1);
            }
        } else {
            event.stopPropagation();
            this.singleSelectAction(row);
        }
    }

    /**
     * row clicks that should be ignored.
     * Required for buttons or check boxes in tables
     *
     * @param event click event
     */
    public ignoreClick(event: MouseEvent): void {
        if (!this.isMultiSelect) {
            event.stopPropagation();
        }
    }

    /**
     * Method to perform an action on click on a row, if not in MultiSelect Modus.
     * Should be overridden by implementations. Currently there is no default action.
     * @param row a ViewModel
     */
    public singleSelectAction(row: V): void {}

    /**
     * enables/disables the multiSelect Mode
     */
    public toggleMultiSelect(): void {
        if (!this.canMultiSelect || this.isMultiSelect) {
            this._multiSelectMode = false;
            this.clearSelection();
        } else {
            this._multiSelectMode = true;
        }
    }

    /**
     * Select all files in the current data source
     */
    public selectAll(): void {
        this.selectedRows = this.dataSource.filteredData;
    }

    public deselectAll(): void {
        this.selectedRows = [];
    }

    /**
     * Returns the current state of the multiSelect modus
     */
    public get isMultiSelect(): boolean {
        return this._multiSelectMode;
    }

    /**
     * checks if a row is currently selected in the multiSelect modus.
     * @param item The row's entry
     */
    public isSelected(item: V): boolean {
        if (!this._multiSelectMode) {
            return false;
        }
        return this.selectedRows.indexOf(item) >= 0;
    }

    /**
     * Handler to quickly unselect all items.
     */
    public clearSelection(): void {
        this.selectedRows = [];
    }

    /**
     * Checks the array of selected items against the datastore data. This is
     * meant to reselect items by their id even if some of their data changed,
     * and to remove selected data that don't exist anymore.
     * To be called after an update of data. Checks if updated selected items
     * are still present in the dataSource, and (re-)selects them. This should
     * be called as the observed datasource updates.
     */
    protected checkSelection(): void {
        const newSelection = [];
        this.selectedRows.forEach(selectedrow => {
            const newrow = this.dataSource.filteredData.find(item => item.id === selectedrow.id);
            if (newrow) {
                newSelection.push(newrow);
            }
        });
        this.selectedRows = newSelection;
    }
}

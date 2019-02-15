import { auditTime } from 'rxjs/operators';
import { BehaviorSubject, Observable } from 'rxjs';

import { BaseModel } from '../../shared/models/base/base-model';
import { BaseViewModel } from '../../site/base/base-view-model';
import { StorageService } from '../core-services/storage.service';
import { BaseRepository } from '../repositories/base-repository';

/**
 * Describes the available filters for a listView.
 * @param isActive: the current state of the filter
 * @param property: the ViewModel's property or method to filter by
 * @param label: An optional, different label (if not present, the property will be used)
 * @param condition: The conditions to be met for a successful display of data. These will
 * be updated by the {@link filterMenu}
 * @param options a list of available options for a filter
 */
export interface OsFilter {
    property: string;
    label?: string;
    options: (OsFilterOption | string)[];
    count?: number;
}

/**
 * Describes a list of available options for a drop down menu of a filter.
 * A filter condition of null will be interpreted as a negative filter
 * ('None of the other filter options').
 * Filter condition numbers/number arrays will be checked against numerical
 * values and as id(s) for objects.
 */
export interface OsFilterOption {
    label: string;
    condition: string | boolean | number | number[];
    isActive?: boolean;
}

/**
 * Filter for the list view. List views can subscribe to its' dataService (providing filter definitions)
 * and will receive their filtered data as observable
 */

export abstract class BaseFilterListService<M extends BaseModel, V extends BaseViewModel> {
    /**
     * stores the currently used raw data to be used for the filter
     */
    private currentRawData: V[];

    /**
     * The currently used filters.
     */
    public filterDefinitions: OsFilter[];

    /**
     * The observable output for the filtered data
     */
    public filterDataOutput = new BehaviorSubject<V[]>([]);

    protected filteredData: V[];

    protected name: string;

    /**
     * @returns the total count of items before the filter
     */
    public get totalCount(): number {
        return this.currentRawData ? this.currentRawData.length : 0;
    }

    /**
     * @returns the amount of items that pass the filter service's filters
     */
    public get filteredCount(): number {
        return this.filteredData ? this.filteredData.length : 0;
    }

    /**
     * Get the amount of filters currently in use by this filter Service
     *
     * @returns a number of filters
     */
    public get activeFilterCount(): number {
        if (!this.filterDefinitions || !this.filterDefinitions.length) {
            return 0;
        }
        let filters = 0;
        for (const filter of this.filterDefinitions) {
            if (filter.count) {
                filters += 1;
            }
        }
        return filters;
    }

    /**
     * Boolean indicationg if there are any filters described in this service
     *
     * @returns true if there are defined filters (regardless of current state)
     */
    public get hasFilterOptions(): boolean {
        return this.filterDefinitions && this.filterDefinitions.length ? true : false;
    }

    /**
     * Constructor.
     */
    public constructor(private store: StorageService, private repo: BaseRepository<V, M>) {}

    /**
     * Initializes the filterService. Returns the filtered data as Observable
     */
    public filter(): Observable<V[]> {
        this.repo
            .getViewModelListObservable()
            .pipe(auditTime(100))
            .subscribe(data => {
                this.currentRawData = data;
                this.filteredData = this.filterData(data);
                this.filterDataOutput.next(this.filteredData);
            });
        this.loadStorageDefinition(this.filterDefinitions);
        return this.filterDataOutput;
    }

    /**
     * Apply a newly created filter
     * @param filter
     */
    public addFilterOption(filterName: string, option: OsFilterOption): void {
        const filter = this.filterDefinitions.find(f => f.property === filterName);
        if (filter) {
            const filterOption = filter.options.find(
                o => typeof o !== 'string' && o.condition === option.condition
            ) as OsFilterOption;
            if (filterOption && !filterOption.isActive) {
                filterOption.isActive = true;
                filter.count += 1;
            }
            if (filter.count === 1) {
                this.filteredData = this.filterData(this.filteredData);
            } else {
                this.filteredData = this.filterData(this.currentRawData);
            }
            this.filterDataOutput.next(this.filteredData);
            this.setStorageDefinition();
        }
    }

    /**
     * Remove a filter option.
     *
     * @param filterName: The property name of this filter
     * @param option: The option to disable
     */
    public removeFilterOption(filterName: string, option: OsFilterOption): void {
        const filter = this.filterDefinitions.find(f => f.property === filterName);
        if (filter) {
            const filterOption = filter.options.find(
                o => typeof o !== 'string' && o.condition === option.condition
            ) as OsFilterOption;
            if (filterOption && filterOption.isActive) {
                filterOption.isActive = false;
                filter.count -= 1;
                this.filteredData = this.filterData(this.currentRawData);
                this.filterDataOutput.next(this.filteredData);
                this.setStorageDefinition();
            }
        }
    }

    /**
     * Toggles a filter option, to be called after a checkbox state has changed.
     * @param filterName
     * @param option
     */
    public toggleFilterOption(filterName: string, option: OsFilterOption): void {
        option.isActive ? this.removeFilterOption(filterName, option) : this.addFilterOption(filterName, option);
    }

    public updateFilterDefinitions(filters: OsFilter[]): void {
        this.loadStorageDefinition(filters);
    }

    /**
     * Retrieve the currently saved filter definition from the StorageService,
     * check their match with current definitions and set the current filter
     * @param definitions: Currently defined Filter definitions
     */
    private loadStorageDefinition(definitions: OsFilter[]): void {
        if (!definitions || !definitions.length) {
            return;
        }
        const me = this;
        this.store.get('filter_' + this.name).then(
            function(storedData: { name: string; data: OsFilter[] }): void {
                const storedFilters = storedData && storedData.data ? storedData.data : [];
                definitions.forEach(definedFilter => {
                    const matchingStoreFilter = storedFilters.find(f => f.property === definedFilter.property);
                    let count = 0;
                    definedFilter.options.forEach(option => {
                        if (typeof option === 'string') {
                            return;
                        }
                        if (matchingStoreFilter && matchingStoreFilter.options) {
                            const storedOption = matchingStoreFilter.options.find(
                                o => typeof o !== 'string' && o.condition === option.condition
                            ) as OsFilterOption;
                            if (storedOption) {
                                option.isActive = storedOption.isActive;
                            }
                        }
                        if (option.isActive) {
                            count += 1;
                        }
                    });
                    definedFilter.count = count;
                });
                me.filterDefinitions = definitions;
                me.filteredData = me.filterData(me.currentRawData);
                me.filterDataOutput.next(me.filteredData);
            },
            function(error: any): void {
                me.filteredData = me.filterData(me.currentRawData);
                me.filterDataOutput.next(me.filteredData);
            }
        );
    }

    /**
     * Save the current filter definitions via StorageService
     */
    private setStorageDefinition(): void {
        this.store.set('filter_' + this.name, {
            name: 'filter_' + this.name,
            data: this.filterDefinitions
        });
    }

    /**
     * Takes an array of data and applies current filters
     */
    private filterData(data: V[]): V[] {
        const filteredData = [];
        if (!data) {
            return filteredData;
        }
        if (!this.filterDefinitions || !this.filterDefinitions.length) {
            return data;
        }
        data.forEach(newItem => {
            let excluded = false;
            for (const filter of this.filterDefinitions) {
                if (filter.count && !this.checkIncluded(newItem, filter)) {
                    excluded = true;
                    break;
                }
            }
            if (!excluded) {
                filteredData.push(newItem);
            }
        });
        return filteredData;
    }

    /**
     * Checks if a given ViewBaseModel passes the filter.
     *
     * @param item
     * @param filter
     * @returns true if the item is to be dispalyed according to the filter
     */
    private checkIncluded(item: V, filter: OsFilter): boolean {
        const nullFilter = filter.options.find(
            option => typeof option !== 'string' && option.isActive && option.condition === null
        );
        let passesNullFilter = true;
        for (const option of filter.options) {
            // ignored options
            if (typeof option === 'string') {
                continue;
            } else if (nullFilter && option === nullFilter) {
                continue;
                // active option. The item is included if it passes this test
            } else if (option.isActive) {
                if (this.checkFilterIncluded(item, filter, option)) {
                    return true;
                }
                // if a null filter is set, the item needs to not pass all inactive filters
            } else if (
                nullFilter &&
                (item[filter.property] !== null || item[filter.property] !== undefined) &&
                this.checkFilterIncluded(item, filter, option)
            ) {
                passesNullFilter = false;
            }
        }
        if (nullFilter && passesNullFilter) {
            return true;
        }
        return false;
    }

    /**
     * Checks an item against a single filter option.
     *
     * @param item A BaseModel to be checked
     * @param filter The parent filter
     * @param option The option to be checked
     * @returns true if the filter condition matches the item
     */
    private checkFilterIncluded(item: V, filter: OsFilter, option: OsFilterOption): boolean {
        if (item[filter.property] === undefined || item[filter.property] === null) {
            return false;
        } else if (Array.isArray(item[filter.property])) {
            const compareValueCondition = (value, condition): boolean => {
                if (value === condition) {
                    return true;
                } else if (typeof value === 'object' && 'id' in value && value.id === condition) {
                    return true;
                }
                return false;
            };
            for (const value of item[filter.property]) {
                if (Array.isArray(option.condition)) {
                    for (const condition of option.condition) {
                        if (compareValueCondition(value, condition)) {
                            return true;
                        }
                    }
                } else {
                    if (compareValueCondition(value, option.condition)) {
                        return true;
                    }
                }
            }
        } else if (Array.isArray(option.condition)) {
            if (
                option.condition.indexOf(item[filter.property]) > -1 ||
                option.condition.indexOf(item[filter.property].id) > -1
            ) {
                return true;
            }
        } else if (typeof item[filter.property] === 'object' && 'id' in item[filter.property]) {
            if (item[filter.property].id === option.condition) {
                return true;
            }
        } else if (item[filter.property] === option.condition) {
            return true;
        } else if (item[filter.property].toString() === option.condition) {
            return true;
        }
        return false;
    }

    /**
     * Retrieves a translatable label or filter property used for displaying the filter
     *
     * @param filter
     * @returns a name, capitalized first character
     */
    public getFilterName(filter: OsFilter): string {
        if (filter.label) {
            return filter.label;
        } else {
            const itemProperty = filter.property as string;
            return itemProperty.charAt(0).toUpperCase() + itemProperty.slice(1);
        }
    }

    /**
     * Removes all active options of a given filter, clearing it
     * @param filter
     */
    public clearFilter(filter: OsFilter): void {
        filter.options.forEach(option => {
            if (typeof option === 'object' && option.isActive) {
                this.removeFilterOption(filter.property, option);
            }
        });
    }

    /**
     * Removes all filters currently in use from this filterService
     */
    public clearAllFilters(): void {
        this.filterDefinitions.forEach(filter => {
            this.clearFilter(filter);
        });
    }
}

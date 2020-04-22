import { BehaviorSubject, Observable, Subscription } from 'rxjs';

import { BaseModel } from 'app/shared/models/base/base-model';
import { BaseRepository } from '../repositories/base-repository';
import { BaseViewModel, TitleInformation } from '../../site/base/base-view-model';
import { OpenSlidesStatusService } from '../core-services/openslides-status.service';
import { StorageService } from '../core-services/storage.service';

/**
 * Describes the available filters for a listView.
 * @param property: the ViewModel's property or method to filter by
 * @param label: An optional, different label (if not present, the property will be used)
 * @param options a list of available options for a filter
 * @param count
 */
export interface OsFilter {
    property: string;
    label?: string;
    options: OsFilterOptions;
    count?: number;
}

/**
 * The type of all filter options. This is an array of options. One option
 * can be OsFilterOption or a string.
 */
export type OsFilterOptions = (OsFilterOption | string)[];

/**
 * Describes a list of available options for a drop down menu of a filter.
 * A filter condition of null will be interpreted as a negative filter
 * ('None of the other filter options').
 * Filter condition numbers/number arrays will be checked against numerical
 * values and as id(s) for objects.
 */
export interface OsFilterOption {
    label: string;
    condition: OsFilterOptionCondition;
    isActive?: boolean;
    isChild?: boolean;
    children?: OsFilterOption[];
}

/**
 * Unique indicated filter with a label and a filter option
 */
export interface OsFilterIndicator {
    property: string;
    option: OsFilterOption;
}

/**
 * Extends the BaseViewModel with a parent
 * Required to represent parent-child relationships in the filter
 */
interface HierarchyModel extends BaseViewModel {
    parent: BaseViewModel;
    children: BaseViewModel<any>[];
}

/**
 * Define the type of a filter condition
 */
export type OsFilterOptionCondition = string | boolean | number | number[];

/**
 * Filter for the list view. List views can subscribe to its' dataService (providing filter definitions)
 * and will receive their filtered data as observable
 */
export abstract class BaseFilterListService<V extends BaseViewModel> {
    /**
     * stores the currently used raw data to be used for the filter
     */
    private inputData: V[];

    /**
     * Subscription for the inputData list.
     * Acts as an semaphore for new filtered data
     */
    protected inputDataSubscription: Subscription;

    /**
     * The currently used filters.
     */
    public filterDefinitions: OsFilter[];

    /**
     * @returns the total count of items before the filter
     */
    public get unfilteredCount(): number {
        return this.inputData ? this.inputData.length : 0;
    }

    /**
     * @returns the amount of items that pass the filter service's filters
     */
    public get filteredCount(): number {
        return this.outputSubject.getValue().length;
    }

    /**
     * Returns all OsFilters containing active filters
     */
    public get activeFilters(): OsFilter[] {
        return this.filterDefinitions.filter(def => def.options.find((option: OsFilterOption) => option.isActive));
    }

    public get filterCount(): number {
        if (this.filterDefinitions) {
            return this.filterDefinitions.reduce((a, b) => a + (b.count || 0), 0);
        } else {
            return 0;
        }
    }

    /**
     * The observable output for the filtered data
     */
    private readonly outputSubject = new BehaviorSubject<V[]>([]);

    /**
     * @return Observable data for the filtered output subject
     */
    public get outputObservable(): Observable<V[]> {
        return this.outputSubject.asObservable();
    }

    /**
     * Boolean indicating if there are any filters described in this service
     *
     * @returns true if there are defined filters (regardless of current state)
     */
    public get hasFilterOptions(): boolean {
        return !!this.filterDefinitions && this.filterDefinitions.length > 0;
    }

    /**
     * Stack OsFilters
     */
    private _filterStack: OsFilterIndicator[] = [];

    /**
     * get stacked filters
     */
    public get filterStack(): OsFilterIndicator[] {
        return this._filterStack;
    }

    /**
     * The key to access stored valued
     */
    protected abstract readonly storageKey: string;

    /**
     * Constructor.
     *
     * @param name the name of the filter service
     * @param store storage service, to read saved filter variables
     */
    public constructor(private store: StorageService, private OSStatus: OpenSlidesStatusService) {}

    /**
     * Initializes the filterService.
     *
     * @param inputData Observable array with ViewModels
     */
    public async initFilters(inputData: Observable<V[]>): Promise<void> {
        let storedFilter: OsFilter[] = null;
        if (!this.OSStatus.isInHistoryMode) {
            storedFilter = await this.store.get<OsFilter[]>('filter_' + this.storageKey);
        }

        if (storedFilter && this.isOsFilter(storedFilter)) {
            this.filterDefinitions = storedFilter;
            this.activeFiltersToStack();
        } else {
            this.filterDefinitions = this.getFilterDefinitions();
            this.storeActiveFilters();
        }

        if (this.inputDataSubscription) {
            this.inputDataSubscription.unsubscribe();
            this.inputDataSubscription = null;
        }
        this.inputDataSubscription = inputData.subscribe(data => {
            this.inputData = data;
            this.updateFilteredData();
        });
    }

    /**
     * Recreates the filter stack out of active filter definitions
     */
    private activeFiltersToStack(): void {
        const stack: OsFilterIndicator[] = [];
        for (const activeFilter of this.activeFilters) {
            const activeOptions = activeFilter.options.filter((option: OsFilterOption) => option.isActive);
            for (const option of activeOptions) {
                stack.push({
                    property: activeFilter.property,
                    option: option as OsFilterOption
                });
            }
        }
        this._filterStack = stack;
    }

    /**
     * Checks if the (stored) filter list matches the current definition of OsFilter
     *
     * @param storedFilter
     * @returns boolean
     */
    private isOsFilter(storedFilter: OsFilter[]): boolean {
        if (Array.isArray(storedFilter) && storedFilter.length) {
            return storedFilter.every(filter => {
                // Interfaces do not exist at runtime. Manually check if the
                // Required information of the interface are present
                return filter.hasOwnProperty('options') && filter.hasOwnProperty('property') && !!filter.property;
            });
        } else {
            return false;
        }
    }

    /**
     * Enforce children implement a method that returns actual filter definitions
     */
    protected abstract getFilterDefinitions(): OsFilter[];

    /**
     * Takes the filter definition from children and using {@link getFilterDefinitions}
     * and sets/updates {@link filterDefinitions}
     */
    public async setFilterDefinitions(): Promise<void> {
        if (this.filterDefinitions) {
            const newDefinitions = this.getFilterDefinitions();

            let storedFilter = null;
            if (!this.OSStatus.isInHistoryMode) {
                storedFilter = await this.store.get<OsFilter[]>('filter_' + this.storageKey);
            }

            if (storedFilter && storedFilter.length && newDefinitions && newDefinitions.length) {
                for (const newDef of newDefinitions) {
                    // for some weird angular bugs, newDef can actually be undefined
                    if (newDef) {
                        let count = 0;
                        const matchingExistingFilter = storedFilter.find(oldDef => oldDef.property === newDef.property);
                        for (const option of newDef.options) {
                            if (typeof option === 'object') {
                                if (matchingExistingFilter && matchingExistingFilter.options) {
                                    const existingOption = matchingExistingFilter.options.find(
                                        o =>
                                            typeof o !== 'string' &&
                                            JSON.stringify(o.condition) === JSON.stringify(option.condition)
                                    ) as OsFilterOption;
                                    if (existingOption) {
                                        option.isActive = existingOption.isActive;
                                    }
                                    if (option.isActive) {
                                        count++;
                                    }
                                }
                            }
                        }
                        newDef.count = count;
                    }
                }
            }

            this.filterDefinitions = newDefinitions;
            this.storeActiveFilters();
        }
    }

    /**
     * Helper function to get the `viewModelListObservable` of a given repository object and creates dynamic
     * filters for them
     *
     * @param repo repository to create dynamic filters from
     * @param filter the OSFilter for the filter property
     * @param noneOptionLabel The label of the non option, if set
     * @param filterFn custom filter function if required
     */
    protected updateFilterForRepo(
        repo: BaseRepository<BaseViewModel, BaseModel, TitleInformation>,
        filter: OsFilter,
        noneOptionLabel?: string,
        filterFn?: (filter: BaseViewModel<any>) => boolean
    ): void {
        repo.getViewModelListObservable().subscribe(viewModel => {
            if (viewModel && viewModel.length) {
                let filterProperties: (OsFilterOption | string)[];

                filterProperties = viewModel.filter(filterFn ? filterFn : () => true).map((model: HierarchyModel) => {
                    return {
                        condition: model.id,
                        label: model.getTitle(),
                        isChild: !!model.parent,
                        children:
                            model.children && model.children.length
                                ? model.children.map(child => {
                                      return {
                                          label: child.getTitle(),
                                          condition: child.id
                                      };
                                  })
                                : undefined
                    };
                });

                if (noneOptionLabel) {
                    filterProperties.push('-');
                    filterProperties.push({
                        condition: null,
                        label: noneOptionLabel
                    });
                }

                filter.options = filterProperties;
                this.setFilterDefinitions();
            }
        });
    }

    /**
     * Update the filtered data and store the current filter options
     */
    public storeActiveFilters(): void {
        this.updateFilteredData();
        if (!this.OSStatus.isInHistoryMode) {
            this.store.set('filter_' + this.storageKey, this.filterDefinitions);
        }
    }

    /**
     * Applies current filters in {@link filterDefinitions} to the {@link inputData} list
     * and publishes the filtered data to the observable {@link outputSubject}
     */
    private updateFilteredData(): void {
        let filteredData: V[];
        if (!this.inputData) {
            filteredData = [];
        } else {
            const preFilteredList = this.preFilter(this.inputData);
            if (preFilteredList) {
                this.inputData = preFilteredList;
            }

            if (!this.filterDefinitions || !this.filterDefinitions.length) {
                filteredData = this.inputData;
            } else {
                filteredData = this.inputData.filter(item =>
                    this.filterDefinitions.every(filter => !filter.count || this.checkIncluded(item, filter))
                );
            }
        }

        this.outputSubject.next(filteredData);
        this.activeFiltersToStack();
    }

    /**
     * Had to be overwritten by children if required
     * Adds the possibility to filter the inputData before the user applied filter
     *
     * @param rawInputData will be set to {@link this.inputData}
     * @returns should be a filtered version of `rawInputData`. Returns void if unused
     */
    protected preFilter(rawInputData: V[]): V[] | void {}

    /**
     * Toggles a filter option, to be called after a checkbox state has changed.
     *
     * @param filterName a filter name as string
     * @param option filter option
     */
    public toggleFilterOption(filterName: string, option: OsFilterOption): void {
        option.isActive ? this.removeFilterOption(filterName, option) : this.addFilterOption(filterName, option);
        this.storeActiveFilters();
    }

    /**
     * Apply a newly created filter
     *
     * @param filterProperty new filter as string
     * @param option filter option
     */
    protected addFilterOption(filterProperty: string, option: OsFilterOption): void {
        const filter = this.filterDefinitions.find(f => f.property === filterProperty);

        if (filter) {
            const filterOption = filter.options.find(
                o => typeof o !== 'string' && o.condition === option.condition
            ) as OsFilterOption;

            if (filterOption && !filterOption.isActive) {
                filterOption.isActive = true;
                this._filterStack.push({ property: filterProperty, option: option });

                if (!filter.count) {
                    filter.count = 1;
                } else {
                    filter.count += 1;
                }

                if (filterOption.children && filterOption.children.length) {
                    for (const child of filterOption.children) {
                        this.addFilterOption(filterProperty, child);
                    }
                }
            }
        }
    }

    /**
     * Remove a filter option.
     *
     * @param filterName The property name of this filter
     * @param option The option to disable
     */
    protected removeFilterOption(filterProperty: string, option: OsFilterOption): void {
        const filter = this.filterDefinitions.find(f => f.property === filterProperty);
        if (filter) {
            const filterOption = filter.options.find(
                o => typeof o !== 'string' && o.condition === option.condition
            ) as OsFilterOption;
            if (filterOption && filterOption.isActive) {
                filterOption.isActive = false;

                // remove filter from stack
                const removeIndex = this._filterStack
                    .map(stacked => stacked.option)
                    .findIndex(mappedOption => {
                        return mappedOption.condition === option.condition;
                    });

                if (removeIndex > -1) {
                    this._filterStack.splice(removeIndex, 1);
                }

                if (filter.count) {
                    filter.count -= 1;
                }

                if (filterOption.children && filterOption.children.length) {
                    for (const child of filterOption.children) {
                        this.removeFilterOption(filterProperty, child);
                    }
                }
            }
        }
    }

    /**
     * Checks if a given ViewBaseModel passes the filter.
     *
     * @param item Usually a view model
     * @param filter The filter to check
     * @returns true if the item is to be displayed according to the filter
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
        } else if (typeof item[filter.property] === 'function') {
            return item[filter.property]() === option.condition;
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
     *
     * @param filter
     * @param update
     */
    public clearFilter(filter: OsFilter, update: boolean = true): void {
        filter.options.forEach(option => {
            if (typeof option === 'object' && option.isActive) {
                this.removeFilterOption(filter.property, option);
            }
        });
        if (update) {
            this.storeActiveFilters();
        }
    }

    /**
     * Removes all filters currently in use from this filterService
     */
    public clearAllFilters(): void {
        if (this.filterDefinitions && this.filterDefinitions.length) {
            this.filterDefinitions.forEach(filter => {
                this.clearFilter(filter, false);
            });
            this.storeActiveFilters();
        }
    }
}

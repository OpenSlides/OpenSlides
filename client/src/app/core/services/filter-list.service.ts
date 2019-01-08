import { auditTime } from 'rxjs/operators';
import { BehaviorSubject, Observable } from 'rxjs';

import { BaseModel } from '../../shared/models/base/base-model';
import { BaseViewModel } from '../../site/base/base-view-model';
import { StorageService } from './storage.service';


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
    options: (OsFilterOption | string )[];
    count?: number;
}

/**
 * Describes a list of available options for a drop down menu of a filter
 */
export interface OsFilterOption {
    label: string;
    condition: string | boolean | number;
    isActive?: boolean;
}



/**
 * Filter for the list view. List views can subscribe to its' dataService (providing filter definitions)
 * and will receive their filtered data as observable
 */

export abstract class FilterListService<M extends BaseModel, V extends BaseViewModel> {

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
     * Constructor.
     */
    public constructor(private store: StorageService, private repo: any) {
        // repo( extends BaseRepository<V, M> ) { // TODO
    }

    /**
     * Initializes the filterService. Returns the filtered data as Observable
     */
    public filter(): Observable<V[]> {
        this.repo.getViewModelListObservable().pipe(auditTime(100)).subscribe( data => {
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
        const filter = this.filterDefinitions.find(f => f.property === filterName );
        if (filter) {
            const filterOption = filter.options.find(o =>
                (typeof o !== 'string') && o.condition === option.condition) as OsFilterOption;
            if (filterOption && !filterOption.isActive){
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

    public removeFilterOption(filterName: string, option: OsFilterOption): void {
        const filter = this.filterDefinitions.find(f => f.property === filterName );
        if (filter) {
            const filterOption = filter.options.find(o =>
                (typeof o !== 'string') && o.condition === option.condition) as OsFilterOption;
            if (filterOption && filterOption.isActive){
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

    public updateFilterDefinitions(filters: OsFilter[]) : void {
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
        this.store.get('filter_' + this.name).then(function(storedData: { name: string, data: OsFilter[] }): void {
            const storedFilters = (storedData && storedData.data) ? storedData.data : [];
            definitions.forEach(definedFilter => {
                const matchingStoreFilter = storedFilters.find(f => f.property === definedFilter.property);
                let count = 0;
                definedFilter.options.forEach(option => {
                    if (typeof option === 'string'){
                        return;
                    };
                    if (matchingStoreFilter && matchingStoreFilter.options){
                        const storedOption = matchingStoreFilter.options.find(o =>
                            typeof o !== 'string' && o.condition === option.condition) as OsFilterOption;
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
        }, function(error: any) : void {
            me.filteredData = me.filterData(me.currentRawData);
            me.filterDataOutput.next(me.filteredData);
        });
    }

    /**
     * Save the current filter definitions via StorageService
     */
    private setStorageDefinition(): void {
        this.store.set('filter_' + this.name, {
            name: 'filter_' + this.name, data: this.filterDefinitions});
    }


    /**
     * Takes an array of data and applies current filters
     */
    private filterData(data: V[]): V[] {
        const filteredData = [];
        if (!data) {
            return filteredData;
        }
        if (!this.filterDefinitions || !this.filterDefinitions.length){
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
            if (!excluded){
                filteredData.push(newItem);
            }
        });
        return filteredData;
    }

    /**
     *  Helper to see if a model instance passes a filter
     * @param item
     * @param filter
     */
    private checkIncluded(item: V, filter: OsFilter): boolean {
        for (const option of filter.options) {
            if (typeof option === 'string' ){
                continue;
            }
            if (option.isActive) {
                if (option.condition === null ) {
                    return this.checkIncludedNegative(item, filter);
                }
                if (item[filter.property] === undefined) {
                    return false;
                }
                if (item[filter.property] instanceof BaseModel ) {
                    if (item[filter.property].id === option.condition){
                        return true;
                }
                } else if (item[filter.property] === option.condition){
                    return true;
                } else if (item[filter.property].toString() === option.condition){
                    return true;
                }
            }
        };
        return false;
    }

    /**
     * Returns true if none of the defined non-null filters apply,
     * aka 'items that match no filter'
     * @param item: A viewModel
     * @param filter
     */
    private checkIncludedNegative(item: V, filter: OsFilter): boolean {
        if (item[filter.property] === undefined) {
            return true;
        }
        for (const option of filter.options) {
            if (typeof option === 'string' || option.condition === null) {
                continue;
            }
            if (item[filter.property] === option.condition) {
                return false;
            } else if (item[filter.property].toString() === option.condition){
                return false;
            }
        }
        return true;
    }

    public getFilterName(filter: OsFilter): string {
        if (filter.label) {
            return filter.label;
        } else {
            const itemProperty = filter.property as string;
            return itemProperty.charAt(0).toUpperCase() + itemProperty.slice(1);
        }
    }

    public get hasActiveFilters(): number {
        if (!this.filterDefinitions || !this.filterDefinitions.length){
            return 0;
        }
        let filters = 0;
        for (const filter of this.filterDefinitions) {
            if (filter.count){
                filters += 1;
            }
        };
        return filters;
    }

    public hasFilterOptions(): boolean {
        return (this.filterDefinitions && this.filterDefinitions.length) ? true : false;
    }

}

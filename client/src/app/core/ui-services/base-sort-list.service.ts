import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BaseViewModel } from '../../site/base/base-view-model';
import { TranslateService } from '@ngx-translate/core';
import { StorageService } from '../core-services/storage.service';
/**
 * Describes the sorting columns of an associated ListView, and their state.
 */
export interface OsSortingDefinition<V> {
    sortProperty: keyof V;
    sortAscending?: boolean;
    options: OsSortingItem<V>[];
}

/**
 * A sorting property (data may be a string, a number, a function, or an object
 * with a toString method) to sort after. Sorting will be done in {@link filterData}
 */
export interface OsSortingItem<V> {
    property: keyof V;
    label?: string;
}

@Injectable({
    providedIn: 'root'
})
export abstract class BaseSortListService<V extends BaseViewModel> {
    /**
     * Observable output that submits the newly sorted data each time a sorting has been done
     */
    public sortedData = new BehaviorSubject<V[]>([]);

    /**
     * The data to be sorted. See also the setter for {@link data}
     */
    private unsortedData: V[];

    /**
     * The current sorting definitions
     */
    public sortOptions: OsSortingDefinition<V>;

    /**
     * used for the key in the StorageService to save/load the correct sorting definitions.
     */
    protected name: string;

    /**
     * The sorting function according to current settings. Set via {@link updateSortFn}.
     */
    private sortFn: (a: V, b: V) => number;

    /**
     * default sorting to use if the client was not initialized before
     */
    protected defaultSorting: keyof V = 'id';

    /**
     * Constructor. Does nothing. TranslateService is used for localeCompeare.
     */
    public constructor(protected translate: TranslateService, private store: StorageService) {}

    /**
     * Put an array of data that you want sorted.
     */
    public set data(data: V[]) {
        this.unsortedData = data;
        this.doAsyncSorting();
    }

    /**
     * Defines the sorting properties, and returns an observable with sorted data
     * @param name arbitrary name, used to save/load correct saved settings from StorageService
     * @param definitions The definitions of the possible options
     */
    public sort(): BehaviorSubject<V[]> {
        this.loadStorageDefinition();
        this.updateSortFn();
        return this.sortedData;
    }

    /**
     * Set the current sorting order
     */
    public set ascending(ascending: boolean) {
        this.sortOptions.sortAscending = ascending;
        this.updateSortFn();
        this.saveStorageDefinition();
        this.doAsyncSorting();
    }

    /**
     * get the current sorting order
     */
    public get ascending(): boolean {
        return this.sortOptions.sortAscending;
    }

    /**
     * set the property of the viewModel the sorting will be based on.
     * If the property stays the same, only the sort direction will be toggled,
     * new sortProperty will result in an ascending order.
     */
    public set sortProperty(property: string) {
        if (this.sortOptions.sortProperty === (property as keyof V)) {
            this.ascending = !this.ascending;
            this.updateSortFn();
        } else {
            this.sortOptions.sortProperty = property as keyof V;
            this.sortOptions.sortAscending = true;
            this.updateSortFn();
            this.doAsyncSorting();
        }
        this.saveStorageDefinition();
    }

    /**
     * get the property of the viewModel the sorting is based on.
     */
    public get sortProperty(): string {
        return this.sortOptions ? (this.sortOptions.sortProperty as string) : '';
    }

    public get isActive(): boolean {
        return this.sortOptions && this.sortOptions.options.length > 0;
    }

    /**
     * Change the property and the sorting direction at the same time
     * @param property
     * @param ascending
     */
    public setSorting(property: string, ascending: boolean): void {
        this.sortOptions.sortProperty = property as keyof V;
        this.sortOptions.sortAscending = ascending;
        this.saveStorageDefinition();
        this.updateSortFn();
        this.doAsyncSorting();
    }

    /**
     * Retrieves the currently active icon for an option.
     * @param option
     */
    public getSortIcon(option: OsSortingItem<V>): string {
        if (!this.sortProperty || this.sortProperty !== (option.property as string)) {
            return '';
        }
        return this.ascending ? 'arrow_downward' : 'arrow_upward';
    }

    public getSortLabel(option: OsSortingItem<V>): string {
        if (option.label) {
            return option.label;
        }
        const itemProperty = option.property as string;
        return itemProperty.charAt(0).toUpperCase() + itemProperty.slice(1);
    }

    /**
     * Retrieve the currently saved sorting definition from the borwser's
     * store
     */
    private async loadStorageDefinition(): Promise<void> {
        const sorting: OsSortingDefinition<V> | null = await this.store.get('sorting_' + this.name);
        if (sorting) {
            if (sorting.sortProperty) {
                this.sortOptions.sortProperty = sorting.sortProperty;
                if (sorting.sortAscending !== undefined) {
                    this.sortOptions.sortAscending = sorting.sortAscending;
                }
            }
        } else {
            this.sortOptions.sortProperty = this.defaultSorting;
            this.sortOptions.sortAscending = true;
        }
        this.updateSortFn();
        this.doAsyncSorting();
    }

    /**
     * SSaves the current sorting definitions to the local store
     */
    private saveStorageDefinition(): void {
        this.store.set('sorting_' + this.name, {
            sortProperty: this.sortProperty,
            ascending: this.ascending
        });
    }

    /**
     * starts sorting, and
     */
    private doAsyncSorting(): Promise<void> {
        const me = this;
        return new Promise(function(): void {
            const data = me.unsortedData.sort(me.sortFn);
            me.sortedData.next(data);
        });
    }

    /**
     * Sorts an array of data synchronously, using the currently configured sorting
     *
     * @param data
     * @returns the data, sorted with the definitions of this service
     */
    public sortSync(data: V[]): V[] {
        return data.sort(this.sortFn);
    }

    /**
     * Recreates the sorting function. Is supposed to be called on init and
     * every time the sorting (property, ascending/descending) or the language changes
     */
    protected updateSortFn(): void {
        const property = this.sortProperty as string;
        const ascending = this.ascending;
        const intl = new Intl.Collator(this.translate.currentLang); // TODO: observe and update sorting on language change

        this.sortFn = function(itemA: V, itemB: V): number {
            const firstProperty = ascending ? itemA[property] : itemB[property];
            const secondProperty = ascending ? itemB[property] : itemA[property];
            if (typeof firstProperty !== typeof secondProperty) {
                // undefined/null items should always land at the end
                if (!firstProperty) {
                    return 1;
                } else if (!secondProperty) {
                    return -1;
                } else {
                    throw new TypeError('sorting of items failed because of mismatched types');
                }
            } else {
                if (
                    (firstProperty === null || firstProperty === undefined) &&
                    (secondProperty === null || secondProperty === undefined)
                ) {
                    return 1;
                }
                switch (typeof firstProperty) {
                    case 'boolean':
                        if (firstProperty === false && secondProperty === true) {
                            return -1;
                        } else {
                            return 1;
                        }
                    case 'number':
                        return firstProperty > secondProperty ? 1 : -1;
                    case 'string':
                        if (!firstProperty) {
                            return 1;
                        }
                        return intl.compare(firstProperty, secondProperty);
                    case 'function':
                        const a = firstProperty();
                        const b = secondProperty();
                        return intl.compare(a, b);
                    case 'object':
                        if (firstProperty instanceof Date) {
                            return firstProperty > secondProperty ? 1 : -1;
                        } else {
                            return intl.compare(firstProperty.toString(), secondProperty.toString());
                        }
                    case 'undefined':
                        return 1;
                    default:
                        return -1;
                }
            }
        };
    }
}

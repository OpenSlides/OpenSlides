import { BehaviorSubject, Subscription, Observable } from 'rxjs';

import { TranslateService } from '@ngx-translate/core';

import { BaseViewModel } from '../../site/base/base-view-model';
import { StorageService } from '../core-services/storage.service';

/**
 * Describes the sorting columns of an associated ListView, and their state.
 */
export interface OsSortingDefinition<V> {
    sortProperty: keyof V;
    sortAscending: boolean;
}

/**
 * A sorting property (data may be a string, a number, a function, or an object
 * with a toString method) to sort after. Sorting will be done in {@link filterData}
 */
export interface OsSortingOption<V> {
    property: keyof V;
    label?: string;
}

/**
 * Base class for generic sorting purposes
 */
export abstract class BaseSortListService<V extends BaseViewModel> {
    /**
     * The data to be sorted. See also the setter for {@link data}
     */
    private inputData: V[];

    /**
     * Subscription for the inputData list.
     * Acts as an semaphore for new filtered data
     */
    private inputDataSubscription: Subscription | null;

    /**
     * Observable output that submits the newly sorted data each time a sorting has been done
     */
    private outputSubject = new BehaviorSubject<V[]>([]);

    /**
     * @returns the sorted output subject as observable
     */
    public get outputObservable(): Observable<V[]> {
        return this.outputSubject.asObservable();
    }

    /**
     * The current sorting definitions
     */
    private sortDefinition: OsSortingDefinition<V>;

    /**
     * The sorting function according to current settings.
     */
    private sortFn: (a: V, b: V) => number;

    /**
     * Set the current sorting order
     *
     * @param ascending ascending sorting if true, descending sorting if false
     */
    public set ascending(ascending: boolean) {
        this.sortDefinition.sortAscending = ascending;
        this.updateSortDefinitions();
    }

    /**
     * @param returns wether current the sorting is ascending or descending
     */
    public get ascending(): boolean {
        return this.sortDefinition.sortAscending;
    }

    /**
     * set the property of the viewModel the sorting will be based on.
     * If the property stays the same, only the sort direction will be toggled,
     * new sortProperty will result in an ascending order.
     *
     * @param property a part of a view model
     */
    public set sortProperty(property: keyof V) {
        if (this.sortDefinition.sortProperty === property) {
            this.ascending = !this.ascending;
        } else {
            this.sortDefinition.sortProperty = property;
            this.sortDefinition.sortAscending = true;
        }
        this.updateSortDefinitions();
    }

    /**
     * @returns the current sorting property
     */
    public get sortProperty(): keyof V {
        return this.sortDefinition.sortProperty;
    }

    /**
     * @returns wether sorting is active or not
     */
    public get isActive(): boolean {
        return this.sortDefinition && this.sortOptions.length > 0;
    }

    /**
     * Enforce children to implement sortOptions
     */
    public abstract sortOptions: OsSortingOption<V>[];

    /**
     * Constructor.
     *
     * @param name the name of the sort view, required for store access
     * @param translate required for language sensitive comparing
     * @param store to save and load sorting preferences
     */
    public constructor(protected name: string, protected translate: TranslateService, private store: StorageService) {}

    /**
     * Enforce children to implement a method that returns the fault sorting
     */
    protected abstract async getDefaultDefinition(): Promise<OsSortingDefinition<V>>;

    /**
     * Defines the sorting properties, and returns an observable with sorted data
     *
     * @param name arbitrary name, used to save/load correct saved settings from StorageService
     * @param definitions The definitions of the possible options
     */
    public async initSorting(inputObservable: Observable<V[]>): Promise<void> {
        if (this.inputDataSubscription) {
            this.inputDataSubscription.unsubscribe();
            this.inputDataSubscription = null;
        }

        if (!this.sortDefinition) {
            this.sortDefinition = await this.store.get<OsSortingDefinition<V> | null>('sorting_' + this.name);
            if (this.sortDefinition && this.sortDefinition.sortProperty) {
                this.updateSortedData();
            } else {
                this.sortDefinition = await this.getDefaultDefinition();
                this.updateSortDefinitions();
            }
        }

        this.inputDataSubscription = inputObservable.subscribe(data => {
            this.inputData = data;
            this.updateSortedData();
        });
    }

    /**
     * Change the property and the sorting direction at the same time
     *
     * @param property a sorting property of a view model
     * @param ascending ascending or descending
     */
    public setSorting(property: keyof V, ascending: boolean): void {
        this.sortDefinition.sortProperty = property;
        this.sortDefinition.sortAscending = ascending;
        this.updateSortDefinitions();
    }

    /**
     * Retrieves the currently active icon for an option.
     *
     * @param option
     * @returns the name of the sorting icon, fit to material icon ligatures
     */
    public getSortIcon(option: OsSortingOption<V>): string {
        if (this.sortProperty !== option.property) {
            return '';
        }
        return this.ascending ? 'arrow_downward' : 'arrow_upward';
    }

    /**
     * Determines and returns an untranslated sorting label as string
     *
     * @param option The sorting option to a ViewModel
     * @returns a sorting label as string
     */
    public getSortLabel(option: OsSortingOption<V>): string {
        if (option.label) {
            return option.label;
        }
        const itemProperty = option.property as string;
        return itemProperty.charAt(0).toUpperCase() + itemProperty.slice(1);
    }

    /**
     * Saves the current sorting definitions to the local store
     */
    private updateSortDefinitions(): void {
        this.updateSortedData();
        this.store.set('sorting_' + this.name, this.sortDefinition);
    }

    /**
     * Sorts an array of data synchronously, using the currently configured sorting
     *
     * @param data Array of ViewModels
     * @returns the data, sorted with the definitions of this service
     */
    public sortSync(data: V[]): V[] {
        return data.sort(this.sortFn);
    }

    /**
     * Recreates the sorting function. Is supposed to be called on init and
     * every time the sorting (property, ascending/descending) or the language changes
     */
    protected updateSortedData(): void {
        if (this.inputData) {
            const property = this.sortProperty as string;
            const intl = new Intl.Collator(this.translate.currentLang);
            this.outputSubject.next(
                this.inputData.sort((itemA, itemB) => {
                    const firstProperty = this.ascending ? itemA[property] : itemB[property];
                    const secondProperty = this.ascending ? itemB[property] : itemA[property];
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
                })
            );
        }
    }
}

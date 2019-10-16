import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { Identifiable } from 'app/shared/models/base/identifiable';
import { Displayable } from 'app/site/base/displayable';

export type SortDefinition<T> = keyof T | OsSortingDefinition<T>;

/**
 * Describes the sorting columns of an associated ListView, and their state.
 */
export interface OsSortingDefinition<T> {
    sortProperty: keyof T;
    sortAscending: boolean;
}

/**
 * A sorting property (data may be a string, a number, a function, or an object
 * with a toString method) to sort after. Sorting will be done in {@link filterData}
 */
export interface OsSortingOption<T> {
    property: keyof T;
    label?: string;
    sortFn?: (itemA: T, itemB: T, ascending: boolean, intl?: Intl.Collator) => number;
}

/**
 * Base sorting service with main functionality for sorting.
 *
 * Extends sorting services to sort with a consistent function.
 */
@Injectable({
    providedIn: 'root'
})
export abstract class BaseSortService<T extends Identifiable & Displayable> {
    /**
     * The sorting function according to current settings.
     */
    public sortFn?: (a: T, b: T, ascending: boolean, intl?: Intl.Collator) => number;

    /**
     * The international localisation.
     */
    protected intl: Intl.Collator;

    /**
     * Constructor.
     * Pass the `TranslatorService`.
     */
    public constructor(protected translate: TranslateService) {
        this.intl = new Intl.Collator(translate.currentLang, {
            numeric: true,
            ignorePunctuation: true,
            sensitivity: 'base'
        });
    }

    /**
     * Helper function to determine false-like values (if they are not boolean)
     * @param property
     */
    private isFalsy(property: any): boolean {
        return property === null || property === undefined || property === 0 || property === '';
    }

    /**
     * Recreates the sorting function. Is supposed to be called on init and
     * every time the sorting (property, ascending/descending) or the language changes
     */
    protected sortItems(itemA: T, itemB: T, sortProperty: keyof T, ascending: boolean = true): number {
        // always sort falsy values to the bottom
        const property = sortProperty as string;
        if (this.isFalsy(itemA[property]) && this.isFalsy(itemB[property])) {
            return 0;
        } else if (this.isFalsy(itemA[property])) {
            return 1;
        } else if (this.isFalsy(itemB[property])) {
            return -1;
        }

        const firstProperty = ascending ? itemA[property] : itemB[property];
        const secondProperty = ascending ? itemB[property] : itemA[property];

        if (this.sortFn) {
            return this.sortFn(itemA, itemB, ascending, this.intl);
        } else {
            switch (typeof firstProperty) {
                case 'boolean':
                    if (!firstProperty && secondProperty) {
                        return -1;
                    } else {
                        return 1;
                    }
                case 'number':
                    return firstProperty > secondProperty ? 1 : -1;
                case 'string':
                    if (firstProperty && !secondProperty) {
                        return -1;
                    } else if (!firstProperty && !!secondProperty) {
                        return 1;
                    } else if ((!secondProperty && !secondProperty) || firstProperty === secondProperty) {
                        return 0;
                    } else {
                        return this.intl.compare(firstProperty, secondProperty);
                    }
                case 'function':
                    const a = firstProperty();
                    const b = secondProperty();
                    return this.intl.compare(a, b);
                case 'object':
                    if (firstProperty instanceof Date) {
                        return firstProperty > secondProperty ? 1 : -1;
                    } else {
                        return this.intl.compare(firstProperty.toString(), secondProperty.toString());
                    }
                case 'undefined':
                    return 1;
                default:
                    return -1;
            }
        }
    }
}

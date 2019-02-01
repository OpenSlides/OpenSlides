import { DetailNavigable } from './detail-navigable';
import { SearchRepresentation } from '../../../core/ui-services/search.service';

/**
 * Asserts, if the given object is searchable.
 *
 * @param object The object to check
 */
export function isSearchable(object: any): object is Searchable {
    return (<Searchable>object).formatForSearch !== undefined;
}

/**
 * One can search for every object implementing this interface.
 */
export interface Searchable extends DetailNavigable {
    /**
     * Should return strings that represents the object.
     */
    formatForSearch: () => SearchRepresentation;
}

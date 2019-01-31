import { BaseModel } from '../base/base-model';
import { Searchable } from '../base/searchable';
import { SearchRepresentation } from '../../../core/ui-services/search.service';

/**
 * Representation of a motion category. Has the nested property "File"
 * @ignore
 */
export class Category extends BaseModel<Category> implements Searchable {
    public id: number;
    public name: string;
    public prefix: string;

    public constructor(input?: any) {
        super('motions/category', 'Category', input);
    }

    public getTitle(): string {
        return this.prefix ? this.prefix + ' - ' + this.name : this.name;
    }

    /**
     * Returns the verbose name of this model.
     *
     * @override
     * @param plural If the name should be plural
     * @param The verbose name
     */
    public getVerboseName(plural: boolean = false): string {
        if (plural) {
            return 'Categories';
        } else {
            return this._verboseName;
        }
    }

    /**
     * Formats the category for search
     *
     * @override
     */
    public formatForSearch(): SearchRepresentation {
        return [this.getTitle()];
    }

    /**
     * TODO: add an id as url parameter, so the category auto-opens.
     */
    public getDetailStateURL(): string {
        return '/motions/category';
    }
}

import { Category } from 'app/shared/models/motions/category';
import { BaseViewModel } from '../../base/base-view-model';
import { SearchRepresentation } from 'app/core/ui-services/search.service';
import { Searchable } from 'app/site/base/searchable';

export interface CategoryTitleInformation {
    prefix: string;
    name: string;
}

/**
 * Category class for the View
 *
 * Stores a Category including all (implicit) references
 * Provides "safe" access to variables and functions in {@link Category}
 * @ignore
 */
export class ViewCategory extends BaseViewModel<Category> implements CategoryTitleInformation, Searchable {
    public static COLLECTIONSTRING = Category.COLLECTIONSTRING;

    public get category(): Category {
        return this._model;
    }

    public get name(): string {
        return this.category.name;
    }

    public get prefix(): string {
        return this.category.prefix;
    }

    /**
     * TODO: Where is this used? Try to avoid this.
     */
    public set prefix(prefix: string) {
        this._model.prefix = prefix;
    }

    /**
     * TODO: Where is this used? Try to avoid this.
     */
    public set name(name: string) {
        this._model.name = name;
    }

    public get prefixedName(): string {
        return this.prefix ? this.prefix + ' - ' + this.name : this.name;
    }

    public constructor(category: Category) {
        super(Category.COLLECTIONSTRING, category);
    }

    public formatForSearch(): SearchRepresentation {
        return [this.name, this.prefix];
    }

    public getDetailStateURL(): string {
        return '/motions/category';
    }

    /**
     * Updates the local objects if required
     * @param update
     */
    public updateDependencies(update: BaseViewModel): void {}
}

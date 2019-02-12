import { Category } from 'app/shared/models/motions/category';
import { BaseViewModel } from '../../base/base-view-model';
import { SearchRepresentation } from 'app/core/ui-services/search.service';
import { Searchable } from 'app/site/base/searchable';

/**
 * Category class for the View
 *
 * Stores a Category including all (implicit) references
 * Provides "safe" access to variables and functions in {@link Category}
 * @ignore
 */
export class ViewCategory extends BaseViewModel implements Searchable {
    public static COLLECTIONSTRING = Category.COLLECTIONSTRING;

    private _category: Category;

    public get category(): Category {
        return this._category;
    }

    public get id(): number {
        return this.category.id;
    }

    public get name(): string {
        return this.category.name;
    }

    public get prefix(): string {
        return this.category.prefix;
    }

    public set prefix(prefix: string) {
        this._category.prefix = prefix;
    }

    public set name(name: string) {
        this._category.name = name;
    }

    public get prefixedName(): string {
        return this.prefix ? this.prefix + ' - ' + this.name : this.name;
    }

    /**
     * This is set by the repository
     */
    public getVerboseName;

    public constructor(category: Category) {
        super(Category.COLLECTIONSTRING);
        this._category = category;
    }

    public getTitle = () => {
        return this.prefixedName;
    };

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

    /**
     * Duplicate this motion into a copy of itself
     */
    public copy(): ViewCategory {
        return new ViewCategory(this._category);
    }
}

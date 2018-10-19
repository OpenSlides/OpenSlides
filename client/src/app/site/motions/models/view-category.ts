import { Category } from '../../../shared/models/motions/category';
import { BaseViewModel } from '../../base/base-view-model';

/**
 * Category class for the View
 *
 * Stores a Category including all (implicit) references
 * Provides "safe" access to variables and functions in {@link Category}
 * @ignore
 */
export class ViewCategory extends BaseViewModel {
    private _category: Category;

    public get category(): Category {
        return this._category;
    }

    public get id(): number {
        return this.category ? this.category.id : null;
    }

    public get name(): string {
        return this.category ? this.category.name : null;
    }

    public get prefix(): string {
        return this.category ? this.category.prefix : null;
    }

    public set prefix(pref: string) {
        this._category.prefix = pref;
    }

    public set name(nam: string) {
        this._category.name = nam;
    }

    public constructor(category?: Category, id?: number, prefix?: string, name?: string) {
        super();
        if (!category) {
            category = new Category();
            category.id = id;
            category.name = name;
            category.prefix = prefix;
        }
        this._category = category;
    }

    public getTitle(): string {
        return this.name;
    }

    /**
     * Updates the local objects if required
     * @param update
     */
    public updateValues(update: Category): void {
        this._category = update;
    }

    /**
     * Duplicate this motion into a copy of itself
     */
    public copy(): ViewCategory {
        return new ViewCategory(this._category);
    }
}

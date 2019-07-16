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

    private _parent?: ViewCategory;

    public get category(): Category {
        return this._model;
    }

    public get parent(): ViewCategory | null {
        return this._parent;
    }

    public get name(): string {
        return this.category.name;
    }

    public get prefix(): string {
        return this.category.prefix;
    }

    public get weight(): number {
        return this.category.weight;
    }

    public get parent_id(): number {
        return this.category.parent_id;
    }

    public get level(): number {
        return this.category.level;
    }

    public get prefixedName(): string {
        return this.prefix ? this.prefix + ' - ' + this.name : this.name;
    }

    /**
     * @returns the name with all parents in brackets: "<Cat> (<CatParent>, <CatParentParent>)"
     */
    public get prefixedNameWithParents(): string {
        const parents = this.collectParents();
        let name = this.prefixedName;
        if (parents.length) {
            name += ' (' + parents.map(parent => parent.prefixedName).join(', ') + ')';
        }
        return name;
    }

    /**
     * Shows the (direct) parent above the current category
     */
    public get nameWithParentAbove(): string {
        if (this.parent) {
            return `${this.parent.toString()}\n${this.toString()}`;
        } else {
            return this.toString();
        }
    }

    public constructor(category: Category, parent?: ViewCategory) {
        super(Category.COLLECTIONSTRING, category);
        this._parent = parent;
    }

    public formatForSearch(): SearchRepresentation {
        return [this.name, this.prefix];
    }

    public getDetailStateURL(): string {
        return '/motions/category';
    }

    /**
     * @returns an array with all parents. The ordering is the direct parent
     * is in front of the array and the "highest" parent the last entry. Returns
     * an empty array if the category does not have any parents.
     */
    public collectParents(): ViewCategory[] {
        if (this.parent) {
            const parents = this.parent.collectParents();
            parents.unshift(this.parent);
            return parents;
        } else {
            return [];
        }
    }

    /**
     * Updates the local objects if required
     * @param update
     */
    public updateDependencies(update: BaseViewModel): void {
        if (update instanceof ViewCategory && update.id === this.parent_id) {
            this._parent = update;
        }
    }
}

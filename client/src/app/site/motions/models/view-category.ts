import { Category } from '../../../shared/models/motions/category';
import { TranslateService } from '@ngx-translate/core';
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
    private _edit: boolean;
    private _synced: boolean;
    private _opened: boolean;

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

    public set synced(bol: boolean) {
        this._synced = bol;
    }

    public set edit(bol: boolean) {
        this._edit = bol;
    }

    public set opened(bol: boolean) {
        this._opened = bol;
    }

    public set prefix(pref: string) {
        this._category.prefix = pref;
    }

    public set name(nam: string) {
        this._category.name = nam;
    }

    public get opened(): boolean {
        return this._opened;
    }

    public get synced(): boolean {
        return this._synced;
    }

    public get edit(): boolean {
        return this._edit;
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
        this._edit = false;
        this._synced = true;
        this._opened = false;
    }

    public getTitle(translate?: TranslateService): string {
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

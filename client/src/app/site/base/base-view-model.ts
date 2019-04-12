import { Displayable } from './displayable';
import { Identifiable } from '../../shared/models/base/identifiable';
import { Collection } from 'app/shared/models/base/collection';
import { BaseModel } from 'app/shared/models/base/base-model';
import { Updateable } from './updateable';

export interface ViewModelConstructor<T extends BaseViewModel> {
    COLLECTIONSTRING: string;
    new (...args: any[]): T;
}

/**
 * Base class for view models. alls view models should have titles.
 */
export abstract class BaseViewModel implements Displayable, Identifiable, Collection, Updateable {
    /**
     * Force children to have an id.
     */
    public abstract id: number;

    /**
     * force children of BaseModel to have a collectionString.
     *
     * Has a getter but no setter.
     */
    protected _collectionString: string;

    /**
     * returns the collectionString.
     *
     * The server and the dataStore use it to identify the collection.
     */
    public get collectionString(): string {
        return this._collectionString;
    }

    public abstract getTitle: () => string;

    /**
     * Returns the verbose name.
     *
     * @param plural If the name should be plural
     * @returns the verbose name of the model
     */
    public abstract getVerboseName: (plural?: boolean) => string;

    /**
     * TODO: Remove verboseName, this must be overwritten by repos..
     *
     * @param verboseName
     * @param collectionString
     */
    public constructor(collectionString: string) {
        this._collectionString = collectionString;
    }

    public getListTitle: () => string = () => {
        return this.getTitle();
    };

    /** return the main model of a view model */
    public abstract getModel(): BaseModel;

    public abstract updateDependencies(update: BaseViewModel): void;

    public toString(): string {
        return this.getTitle();
    }
}

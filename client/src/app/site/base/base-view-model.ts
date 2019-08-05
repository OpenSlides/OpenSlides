import { BaseModel } from 'app/shared/models/base/base-model';
import { Collection } from 'app/shared/models/base/collection';
import { Displayable } from './displayable';
import { Identifiable } from '../../shared/models/base/identifiable';

export type TitleInformation = object;

export interface ViewModelConstructor<T extends BaseViewModel> {
    COLLECTIONSTRING: string;
    new (...args: any[]): T;
}

/**
 * Base class for view models. alls view models should have titles.
 */
export abstract class BaseViewModel<M extends BaseModel = any> implements Displayable, Identifiable, Collection {
    public get id(): number {
        return this._model.id;
    }

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

    /**
     * @returns the element id of the model
     */
    public get elementId(): string {
        return `${this.collectionString}:${this.id}`;
    }

    public getTitle: () => string;
    public getListTitle: () => string;

    /**
     * Returns the verbose name.
     *
     * @param plural If the name should be plural
     * @returns the verbose name of the model
     */
    public getVerboseName: (plural?: boolean) => string;

    /**
     * @param collectionString
     * @param model
     */
    public constructor(protected _model: M) {}

    /**
     * @returns the main underlying model of the view model
     */
    public getModel(): M {
        return this._model;
    }

    public toString(): string {
        return this.getTitle();
    }
}

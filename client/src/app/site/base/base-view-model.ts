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
 * Base class for view models.
 */
export abstract class BaseViewModel<M extends BaseModel = any> {
    /**
     * @returns the element id of the model
     */
    public get elementId(): string {
        return this._model.elementId;
    }

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
    public toJSON(): M {
        return this.getModel();
    }
    public getUpdatedModel(update: Partial<M>): M {
        return this.getModel().getUpdatedVersion(update);
    }
}
export interface BaseViewModel<M extends BaseModel = any> extends Displayable, Identifiable, Collection {
    getTitle: () => string;
    getListTitle: () => string;

    /**
     * Returns the verbose name.
     *
     * @param plural If the name should be plural
     * @returns the verbose name of the model
     */
    getVerboseName: (plural?: boolean) => string;
}

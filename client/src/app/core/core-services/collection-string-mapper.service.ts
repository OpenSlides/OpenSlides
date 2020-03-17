import { Injectable } from '@angular/core';

import { BaseRepository } from 'app/core/repositories/base-repository';
import { BaseViewModel, TitleInformation, ViewModelConstructor } from 'app/site/base/base-view-model';
import { BaseModel, ModelConstructor } from '../../shared/models/base/base-model';

/**
 * Unifies the ModelConstructor and ViewModelConstructor.
 */
interface UnifiedConstructors {
    COLLECTIONSTRING: string;
    new (...args: any[]): any;
}

/**
 * Every types supported: (View)ModelConstructors, repos and collectionstrings.
 */
type TypeIdentifier = UnifiedConstructors | BaseRepository<any, any, any> | string;

type CollectionStringMappedTypes = [
    ModelConstructor<BaseModel>,
    ViewModelConstructor<BaseViewModel>,
    BaseRepository<BaseViewModel<any>, BaseModel<any>, TitleInformation>
];

/**
 * Registeres the mapping between collection strings, models constructors, view
 * model constructors and repositories.
 * All models need to be registered!
 */
@Injectable({
    providedIn: 'root'
})
export class CollectionStringMapperService {
    /**
     * Maps collection strings to mapping entries
     */
    private collectionStringMapping: {
        [collectionString: string]: CollectionStringMappedTypes;
    } = {};

    public constructor() {}

    /**
     * Registers the combination of a collection string, model, view model and repository
     * @param collectionString
     * @param model
     */
    public registerCollectionElement<V extends BaseViewModel<M>, M extends BaseModel>(
        model: ModelConstructor<M>,
        viewModel: ViewModelConstructor<V>,
        repository: BaseRepository<V, M, TitleInformation>
    ): void {
        this.collectionStringMapping[model.COLLECTIONSTRING] = [model, viewModel, repository];
    }

    /**
     * @param obj The object to get the collection string from.
     * @returns the collectionstring
     */
    public getCollectionString(obj: TypeIdentifier): string {
        if (typeof obj === 'string') {
            return obj;
        } else {
            return obj.COLLECTIONSTRING;
        }
    }

    /**
     * @returns true, if the given collection is known by this service.
     */
    public isCollectionRegistered(collectionString: string): boolean {
        return !!this.collectionStringMapping[collectionString];
    }

    /**
     * @param obj The object to get the model constructor from.
     * @returns the model constructor
     */
    public getModelConstructor<M extends BaseModel>(obj: TypeIdentifier): ModelConstructor<M> | null {
        if (this.isCollectionRegistered(this.getCollectionString(obj))) {
            return this.collectionStringMapping[this.getCollectionString(obj)][0] as ModelConstructor<M>;
        }
    }

    /**
     * @param obj The object to get the view model constructor from.
     * @returns the view model constructor
     */
    public getViewModelConstructor<M extends BaseViewModel>(obj: TypeIdentifier): ViewModelConstructor<M> | null {
        if (this.isCollectionRegistered(this.getCollectionString(obj))) {
            return this.collectionStringMapping[this.getCollectionString(obj)][1] as ViewModelConstructor<M>;
        }
    }

    /**
     * @param obj The object to get the repository from.
     * @returns the repository
     */
    public getRepository<V extends BaseViewModel, M extends BaseModel, T extends TitleInformation>(
        obj: TypeIdentifier
    ): BaseRepository<V & T, M, T> | null {
        if (this.isCollectionRegistered(this.getCollectionString(obj))) {
            return this.collectionStringMapping[this.getCollectionString(obj)][2] as BaseRepository<V & T, M, T>;
        }
    }

    /**
     * @returns all registered repositories.
     */
    public getAllRepositories(): BaseRepository<any, any, any>[] {
        return Object.values(this.collectionStringMapping).map((types: CollectionStringMappedTypes) => types[2]);
    }

    /**
     * Validates the given element id. It must have the form `<collection>:<id>`, with
     * <collection> being a registered collection and the id a valid integer greater then 0.
     *
     * @param elementId The element id.
     * @returns true, if the element id is valid.
     */
    public isElementIdValid(elementId: any): boolean {
        if (!elementId || typeof elementId !== 'string') {
            return false;
        }

        const splitted = elementId.split(':');
        if (splitted.length !== 2) {
            return false;
        }

        const id = parseInt(splitted[1], 10);
        if (isNaN(id) || id <= 0) {
            return false;
        }

        return Object.keys(this.collectionStringMapping).some(collection => collection === splitted[0]);
    }
}

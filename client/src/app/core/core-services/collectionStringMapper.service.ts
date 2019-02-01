import { Injectable } from '@angular/core';

import { ModelConstructor, BaseModel } from '../../shared/models/base/base-model';
import { BaseRepository } from 'app/core/repositories/base-repository';

/**
 * Registeres the mapping of collection strings <--> actual types. Every Model should register itself here.
 */
@Injectable({
    providedIn: 'root'
})
export class CollectionStringMapperService {
    /**
     * Mapps collection strings to model constructors. Accessed by {@method registerCollectionElement} and
     * {@method getCollectionStringType}.
     */
    private collectionStringsTypeMapping: {
        [collectionString: string]: [ModelConstructor<BaseModel>, BaseRepository<any, any>];
    } = {};

    /**
     * Constructor to create the NotifyService. Registers itself to the WebsocketService.
     * @param websocketService
     */
    public constructor() {}

    /**
     * Registers the type to the collection string
     * @param collectionString
     * @param model
     */
    public registerCollectionElement(
        collectionString: string,
        model: ModelConstructor<BaseModel>,
        repository: BaseRepository<any, any>
    ): void {
        this.collectionStringsTypeMapping[collectionString] = [model, repository];
    }

    /**
     * Returns the constructor of the requested collection or undefined, if it is not registered.
     * @param collectionString the requested collection
     */
    public getModelConstructor(collectionString: string): ModelConstructor<BaseModel> {
        return this.collectionStringsTypeMapping[collectionString][0];
    }

    /**
     * Returns the repository of the requested collection or undefined, if it is not registered.
     * @param collectionString the requested collection
     */
    public getRepository(collectionString: string): BaseRepository<any, any> {
        return this.collectionStringsTypeMapping[collectionString][1];
    }

    /**
     * Returns the collection string of a given ModelConstructor or undefined, if it is not registered.
     * @param ctor
     */
    public getCollectionString(ctor: ModelConstructor<BaseModel>): string {
        return Object.keys(this.collectionStringsTypeMapping).find((collectionString: string) => {
            return ctor === this.collectionStringsTypeMapping[collectionString][0];
        });
    }
}

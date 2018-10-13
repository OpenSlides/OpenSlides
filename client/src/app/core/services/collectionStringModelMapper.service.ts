import { Injectable } from '@angular/core';
import { ModelConstructor, BaseModel } from '../../shared/models/base/base-model';

/**
 * Registeres the mapping of collection strings <--> actual types. Every Model should register itself here.
 */
@Injectable({
    providedIn: 'root'
})
export class CollectionStringModelMapperService {
    /**
     * Mapps collection strings to model constructors. Accessed by {@method registerCollectionElement} and
     * {@method getCollectionStringType}.
     */
    private static collectionStringsTypeMapping: { [collectionString: string]: ModelConstructor<BaseModel> } = {};

    /**
     * Returns the collection string of a given ModelConstructor or undefined, if it is not registered.
     * @param ctor
     * @deprecated Should inject this service and don't use the static functions.
     */
    public static getCollectionString(ctor: ModelConstructor<BaseModel>): string {
        return Object.keys(CollectionStringModelMapperService.collectionStringsTypeMapping).find(
            (collectionString: string) => {
                return ctor === CollectionStringModelMapperService.collectionStringsTypeMapping[collectionString];
            }
        );
    }

    /**
     * Constructor to create the NotifyService. Registers itself to the WebsocketService.
     * @param websocketService
     */
    public constructor() {}

    /**
     * Registers the type to the collection string
     * @param collectionString
     * @param type
     */
    public registerCollectionElement(collectionString: string, type: ModelConstructor<BaseModel>): void {
        CollectionStringModelMapperService.collectionStringsTypeMapping[collectionString] = type;
    }

    /**
     * Returns the constructor of the requested collection or undefined, if it is not registered.
     * @param collectionString the requested collection
     */
    public getModelConstructor(collectionString: string): ModelConstructor<BaseModel> {
        return CollectionStringModelMapperService.collectionStringsTypeMapping[collectionString];
    }

    /**
     * Returns the collection string of a given ModelConstructor or undefined, if it is not registered.
     * @param ctor
     */
    public getCollectionString(ctor: ModelConstructor<BaseModel>): string {
        return Object.keys(CollectionStringModelMapperService.collectionStringsTypeMapping).find(
            (collectionString: string) => {
                return ctor === CollectionStringModelMapperService.collectionStringsTypeMapping[collectionString];
            }
        );
    }
}

import { ModelConstructor } from '../../shared/models/base.model';

/**
 * Registeres the mapping of collection strings <--> actual types. Every Model should register itself here.
 */
export class CollectionStringModelMapperService {
    /**
     * Mapps collection strings to model constructors. Accessed by {@method registerCollectionElement} and
     * {@method getCollectionStringType}.
     */
    private static collectionStringsTypeMapping: { [collectionString: string]: ModelConstructor } = {};

    /**
     * Constructor to create the NotifyService. Registers itself to the WebsocketService.
     * @param websocketService
     */
    constructor() {}

    /**
     * Registers the type to the collection string
     * @param collectionString
     * @param type
     */
    public static registerCollectionElement(collectionString: string, type: ModelConstructor) {
        CollectionStringModelMapperService.collectionStringsTypeMapping[collectionString] = type;
    }

    /**
     * Returns the constructor of the requested collection or undefined, if it is not registered.
     * @param collectionString the requested collection
     */
    public static getCollectionStringType(collectionString: string): ModelConstructor {
        return CollectionStringModelMapperService.collectionStringsTypeMapping[collectionString];
    }
}

export function isContentObject(obj: any): obj is ContentObject {
    return !!obj && obj.id !== undefined && obj.collection !== undefined;
}

/**
 * The representation of content objects. Holds the unique combination
 * of the collection and the id.
 */
export interface ContentObject {
    id: number;
    collection: string;
}

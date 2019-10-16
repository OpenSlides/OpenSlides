import { Collection } from './collection';
import { Deserializer } from './deserializer';
import { Identifiable } from './identifiable';

export interface ModelConstructor<T extends BaseModel<T>> {
    COLLECTIONSTRING: string;
    new (...args: any[]): T;
}

/**
 * Abstract parent class to set rules and functions for all models.
 * When inherit from this class, give the subclass as the type. E.g. `class Motion extends BaseModel<Motion>`
 */
export abstract class BaseModel<T = any> extends Deserializer implements Identifiable, Collection {
    public get elementId(): string {
        return `${this.collectionString}:${this.id}`;
    }
    /**
     * force children of BaseModel to have an id
     */
    public abstract id: number;

    protected constructor(public readonly collectionString: string, input?: Partial<T>) {
        super(input);
    }

    public getUpdatedVersion(update: Partial<T>): T {
        const copy: T = (<any>Object.assign({}, this)) as T;
        return Object.assign(copy, update);
    }
}

import { OpenSlidesComponent } from 'app/openslides.component';
import { Deserializable } from './deserializable';
import { Displayable } from './displayable';
import { Identifiable } from './identifiable';

export interface ModelConstructor<T extends BaseModel<T>> {
    new (...args: any[]): T;
}

/**
 * Abstract parent class to set rules and functions for all models.
 * When inherit from this class, give the subclass as the type. E.g. `class Motion extends BaseModel<Motion>`
 */
export abstract class BaseModel<T = object> extends OpenSlidesComponent
    implements Deserializable, Displayable, Identifiable {
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
     * Children should also have a verbose name for generic display purposes
     */
    protected _verboseName: string;

    /**
     * force children of BaseModel to have an id
     */
    public abstract id: number;

    /**
     * constructor that calls super from parent class
     *
     * @param collectionString
     * @param verboseName
     * @param input
     */
    protected constructor(collectionString: string, verboseName: string, input?: any) {
        super();
        this._collectionString = collectionString;
        this._verboseName = verboseName;

        if (input) {
            this.changeNullValuesToUndef(input);
            this.deserialize(input);
        }
    }

    /**
     * Prevent to send literally "null" if should be send
     * @param input object to deserialize
     */
    public changeNullValuesToUndef(input: any): void {
        Object.keys(input).forEach(key => {
            if (input[key] === null) {
                input[key] = undefined;
            }
        });
    }

    /**
     * update the values of the base model with new values
     */
    public patchValues(update: Partial<T>): void {
        Object.assign(this, update);
    }

    public abstract getTitle(): string;

    public getListTitle(): string {
        return this.getTitle();
    }

    public toString(): string {
        return this.getTitle();
    }

    /**
     * Returns the verbose name. Makes it plural by adding a 's'.
     *
     * @param plural If the name should be plural
     * @returns the verbose name of the model
     */
    public getVerboseName(plural: boolean = false): string {
        if (plural) {
            return this._verboseName + 's'; // I love english. This works for all our models (participantS, electionS,
            // topicS, motionS, (media)fileS, motion blockS, commentS, personal noteS, projectorS, messageS, countdownS, ...)
            // Just categorIES need to overwrite this...
        } else {
            return this._verboseName;
        }
    }

    /**
     * Most simple and most commonly used deserialize function.
     * Inherited to children, can be overwritten for special use cases
     * @param input JSON data for deserialization.
     */
    public deserialize(input: any): void {
        Object.assign(this, input);
    }
}

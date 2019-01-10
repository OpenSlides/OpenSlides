import { BaseModel } from '../base/base-model';

/**
 * A projectorelement must have a name and optional attributes.
 * error is listed here, because this might be set by the server, if
 * something is wrong and I want you to be sensible about this.
 */
export interface ProjectorElement {
    /**
     * The name of the element.
     */
    name: string;

    /**
     * An optional error. If this is set, this element is invalid, so
     * DO NOT read additional data (name is save).
     */
    error?: string;

    /**
     * Additional data.
     */
    [key: string]: any;
}

/**
 * Multiple elements.
 */
export type ProjectorElements = ProjectorElement[];

/**
 * A projectiondefault
 */
export interface ProjectionDefault {
    id: number;
    name: string;
    display_name: string;
    projector_id: number;
}

/**
 * Representation of a projector. Has the nested property "projectiondefaults"
 * @ignore
 */
export class Projector extends BaseModel<Projector> {
    public id: number;
    public elements: ProjectorElements;
    public scale: number;
    public scroll: number;
    public name: string;
    public width: number;
    public height: number;
    public projectiondefaults: ProjectionDefault[];

    public constructor(input?: any) {
        super('core/projector', 'Projector', input);
    }

    /**
     * Returns true, if there is an element with the given name (and optionally
     * an id). If the id is given, the element to search MUST have this id.
     *
     * @param name The name of the element
     * @param id The optional id to check.
     * @returns true, if there is at least one element with the given name (and id).
     */
    public isElementShown(name: string, id?: number): boolean {
        return this.elements.some(element => element.name === name && (!id || element.id === id));
    }

    /**
     * Removes all elements, that do not have `stable=true`.
     */
    public removeAllNonStableElements(): void {
        this.elements = this.elements.filter(element => element.stable);
    }

    /**
     * Adds the given element to the projectorelements
     *
     * @param element The element to add.
     */
    public addElement<T extends ProjectorElement>(element: T): void {
        this.elements.push(element);
    }

    /**
     * Removes elements given by the name and optional id. If no id is given
     * all elements with a matching name are removed.
     *
     * If an id is given, ut the element dies not specify an id, it will be removed.
     *
     * @param name The name to search
     * @param id The optional id to search.
     */
    public removeElementByNameAndId(name: string, id?: number): void {
        this.elements = this.elements.filter(
            element => element.name !== name || (!id && !element.id && element.id !== id)
        );
    }

    public getTitle(): string {
        return this.name;
    }
}

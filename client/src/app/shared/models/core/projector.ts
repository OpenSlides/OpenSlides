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

export interface IdentifiableProjectorElement extends ProjectorElement {
    getIdentifiers(): (keyof IdentifiableProjectorElement)[];
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
    public elements_preview: ProjectorElements;
    public elements_history: ProjectorElements[];
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
     * Must match all given identifiers. If a projectorelement does not have all keys
     * to identify, it will be removed, if all existing keys match
     *
     * @returns true, TODO
     */
    public isElementShown(element: IdentifiableProjectorElement): boolean {
        return this.elements.some(elementOnProjector => {
            return element.getIdentifiers().every(identifier => {
                return !elementOnProjector[identifier] || elementOnProjector[identifier] === element[identifier];
            });
        });
    }

    /**
     * Removes all elements, that do not have `stable=true`.
     *
     * TODO: use this.partitionArray
     *
     * @returns all removed unstable elements
     */
    public removeAllNonStableElements(): ProjectorElements {
        const unstableElements = this.elements.filter(element => !element.stable);
        this.elements = this.elements.filter(element => element.stable);
        return unstableElements;
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
     * Must match everything. If a projectorelement does not have all keys
     * to identify, it will be removed, if all existing keys match
     */
    public removeElements(element: IdentifiableProjectorElement): ProjectorElements {
        let removedElements: ProjectorElements;
        let nonRemovedElements: ProjectorElements;
        [removedElements, nonRemovedElements] = this.partitionArray(this.elements, elementOnProjector => {
            return element.getIdentifiers().every(identifier => {
                return !elementOnProjector[identifier] || elementOnProjector[identifier] === element[identifier];
            });
        });
        this.elements = nonRemovedElements;
        return removedElements;
    }

    private partitionArray<T>(array: T[], callback: (element: T) => boolean): [T[], T[]] {
        return array.reduce(
            (result, element) => {
                result[callback(element) ? 0 : 1].push(element);
                return result;
            },
            [[], []] as [T[], T[]]
        );
    }

    public getTitle(): string {
        return this.name;
    }
}

import { BaseModel } from '../base/base-model';

export interface ProjectorElementOptions {
    /**
     * Additional data.
     */
    [key: string]: any;
}

/**
 * A projectorelement must have a name and optional attributes.
 * error is listed here, because this might be set by the server, if
 * something is wrong and I want you to be sensible about this.
 */
export interface ProjectorElement extends ProjectorElementOptions {
    /**
     * The name of the element.
     */
    name: string;

    /**
     * An optional error. If this is set, this element is invalid, so
     * DO NOT read additional data (name is save).
     */
    error?: string;
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
 *
 * TODO: Move all function to the viewprojector.
 *
 * @ignore
 */
export class Projector extends BaseModel<Projector> {
    public static COLLECTIONSTRING = 'core/projector';

    public id: number;
    public elements: ProjectorElements;
    public elements_preview: ProjectorElements;
    public elements_history: ProjectorElements[];
    public scale: number;
    public scroll: number;
    public name: string;
    public width: number;
    public height: number;
    public reference_projector_id: number;
    public projectiondefaults: ProjectionDefault[];
    public background_color: string;
    public header_background_color: string;
    public header_font_color: string;
    public header_h1_color: string;
    public show_header_footer: boolean;
    public show_title: boolean;
    public show_logo: boolean;

    public constructor(input?: any) {
        super(Projector.COLLECTIONSTRING, input);
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
        let unstableElements: ProjectorElements;
        let stableElements: ProjectorElements;

        [unstableElements, stableElements] = this.partitionArray(this.elements, element => !element.stable);

        this.elements = stableElements;
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
     * Removes and returns all projector elements, witch can be identified with the
     * given element.
     *
     * @param element The element to remove
     * @returns all removed projector elements
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

    /**
     * Splits up the array into two arrays. All elements with a true return value from the callback
     * will be in the fist array, all others in the second one.
     *
     * @param array The array to split
     * @param callback To evaluate every entry
     * @returns the splitted array
     */
    private partitionArray<T>(array: T[], callback: (element: T) => boolean): [T[], T[]] {
        return array.reduce(
            (result, element) => {
                result[callback(element) ? 0 : 1].push(element);
                return result;
            },
            [[], []] as [T[], T[]]
        );
    }
}

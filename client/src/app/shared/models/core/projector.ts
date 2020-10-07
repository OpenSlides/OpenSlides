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
 * Compares an identifiable element to an element. Every identifier of `a` must match, if
 * the attribute is given in the element `b`.
 *
 * @param a The identifiable element
 * @param b The non-identifiable element
 */
export function elementIdentifies(a: IdentifiableProjectorElement, b: ProjectorElement): boolean {
    return a.getIdentifiers().every(identifier => {
        return !b[identifier] || b[identifier] === a[identifier];
    });
}

/**
 * Multiple elements.
 */
export type ProjectorElements = ProjectorElement[];

/**
 * Representation of a projector.
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
    public aspect_ratio_numerator: number;
    public aspect_ratio_denominator: number;
    public reference_projector_id: number;
    public projectiondefaults_id: number[];
    public color: string;
    public background_color: string;
    public header_background_color: string;
    public header_font_color: string;
    public header_h1_color: string;
    public chyron_background_color: string;
    public chyron_font_color: string;
    public show_header_footer: boolean;
    public show_title: boolean;
    public show_logo: boolean;

    /**
     * @returns Calculate the height of the projector
     */
    public get height(): number {
        const ratio = this.aspect_ratio_numerator / this.aspect_ratio_denominator;
        return this.width / ratio;
    }

    /**
     * get the aspect ratio as string
     */
    public get aspectRatio(): string {
        return [this.aspect_ratio_numerator, this.aspect_ratio_denominator].join(':');
    }

    public get firstUnstableElement(): ProjectorElement {
        let elementIndex = 0;
        /**
         * while we could use a filter function to remove all stable elements, I expect
         * this approach to be the fastest
         */
        while (!!this.elements[elementIndex]?.stable) {
            elementIndex++;
        }
        return this.elements[elementIndex] ?? null;
    }

    /**
     * Set the aspect ratio
     */
    public set aspectRatio(ratioString: string) {
        const ratio = ratioString.split(':').map(x => +x);
        if (ratio.length === 2) {
            this.aspect_ratio_numerator = ratio[0];
            this.aspect_ratio_denominator = ratio[1];
        } else {
            throw new Error('Projector received unexpected aspect ratio! ' + ratio.toString());
        }
    }

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
            return elementIdentifies(element, elementOnProjector);
        });
        this.elements = nonRemovedElements;
        return removedElements;
    }

    /**
     * Replaces all elements with the given elements, if these elements can identify to the
     * given one.
     *
     * @param element The element to replace
     */
    public replaceElements(element: IdentifiableProjectorElement): void {
        this.elements = this.elements.map(elementOnProjector =>
            elementIdentifies(element, elementOnProjector) ? element : elementOnProjector
        );
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

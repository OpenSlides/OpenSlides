import { BaseModel } from '../base.model';

/**
 * Representation of a projector. Has the nested property "projectiondefaults"
 * @ignore
 */
export class Projector extends BaseModel {
    protected _collectionString: string;
    id: number;
    elements: Object;
    scale: number;
    scroll: number;
    name: string;
    blank: boolean;
    width: number;
    height: number;
    projectiondefaults: Object[];

    constructor(
        id?: number,
        elements?: Object,
        scale?: number,
        scroll?: number,
        name?: string,
        blank?: boolean,
        width?: number,
        height?: number,
        projectiondefaults?: Object[]
    ) {
        super();
        this._collectionString = 'core/projector';
        this.id = id;
        this.elements = elements;
        this.scale = scale;
        this.scroll = scroll;
        this.name = name;
        this.blank = blank;
        this.width = width;
        this.height = height;
        this.projectiondefaults = projectiondefaults;
    }
}

BaseModel.registerCollectionElement('core/projector', Projector);

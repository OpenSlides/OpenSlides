import { BaseModel } from 'app/core/models/baseModel';

export class Projector extends BaseModel {
    static collectionString = 'core/projector';
    id: number;
    blank: boolean;
    elements: Object;
    height: number;
    name: string;
    projectiondefaults: BaseModel[];
    scale: number;
    scroll: number;
    width: number;

    constructor(
        id: number,
        blank?: boolean,
        elements?: Object,
        height?: number,
        name?: string,
        projectiondefaults?: BaseModel[],
        scale?: number,
        scroll?: number,
        width?: number
    ) {
        super(id);
        this.blank = blank;
        this.elements = elements;
        this.height = height;
        this.name = name;
        this.projectiondefaults = projectiondefaults;
        this.scale = scale;
        this.scroll = scroll;
        this.width = width;
    }

    public getCollectionString(): string {
        return Projector.collectionString;
    }
}

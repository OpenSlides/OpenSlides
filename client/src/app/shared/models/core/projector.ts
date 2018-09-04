import { BaseModel } from '../base.model';

/**
 * Representation of a projector. Has the nested property "projectiondefaults"
 * @ignore
 */
export class Projector extends BaseModel {
    protected _collectionString: string;
    public id: number;
    public elements: Object;
    public scale: number;
    public scroll: number;
    public name: string;
    public blank: boolean;
    public width: number;
    public height: number;
    public projectiondefaults: Object[];

    public constructor(input?: any) {
        super();
        this._collectionString = 'core/projector';
        if (input) {
            this.deserialize(input);
        }
    }
}

BaseModel.registerCollectionElement('core/projector', Projector);

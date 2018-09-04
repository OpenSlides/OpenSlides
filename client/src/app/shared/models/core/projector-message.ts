import { BaseModel } from '../base.model';

/**
 * Representation of a projector message.
 * @ignore
 */
export class ProjectorMessage extends BaseModel {
    protected _collectionString: string;
    public id: number;
    public message: string;

    public constructor(input?: any) {
        super();
        this._collectionString = 'core/projector-message';
        if (input) {
            this.deserialize(input);
        }
    }
}

BaseModel.registerCollectionElement('core/projector-message', ProjectorMessage);

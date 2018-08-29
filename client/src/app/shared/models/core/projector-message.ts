import { BaseModel } from '../base.model';

/**
 * Representation of a projector message.
 * @ignore
 */
export class ProjectorMessage extends BaseModel {
    protected _collectionString: string;
    public id: number;
    public message: string;

    public constructor(id?: number, message?: string) {
        super();
        this._collectionString = 'core/projector-message';
        this.id = id;
        this.message = message;
    }
}

BaseModel.registerCollectionElement('core/projector-message', ProjectorMessage);

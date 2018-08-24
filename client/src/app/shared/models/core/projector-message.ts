import { BaseModel } from '../base.model';

/**
 * Representation of a projector message.
 * @ignore
 */
export class ProjectorMessage extends BaseModel {
    protected _collectionString: string;
    id: number;
    message: string;

    constructor(id?: number, message?: string) {
        super();
        this._collectionString = 'core/projector-message';
        this.id = id;
        this.message = message;
    }
}

BaseModel.registerCollectionElement('core/projector-message', ProjectorMessage);

import { BaseModel } from '../base.model';

/**
 * Representation of a projector message.
 * @ignore
 */
export class ProjectorMessage extends BaseModel {
    public id: number;
    public message: string;

    public constructor(input?: any) {
        super('core/projector-message', input);
    }
}

BaseModel.registerCollectionElement('core/projector-message', ProjectorMessage);

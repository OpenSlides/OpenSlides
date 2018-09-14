import { ProjectableBaseModel } from '../base/projectable-base-model';

/**
 * Representation of a projector message.
 * @ignore
 */
export class ProjectorMessage extends ProjectableBaseModel {
    public id: number;
    public message: string;

    public constructor(input?: any) {
        super('core/projector-message', input);
    }

    public getTitle(): string {
        return 'Projectormessage';
    }
}

ProjectableBaseModel.registerCollectionElement('core/projector-message', ProjectorMessage);

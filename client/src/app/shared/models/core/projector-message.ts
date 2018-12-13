import { ProjectableBaseModel } from '../base/projectable-base-model';

/**
 * Representation of a projector message.
 * @ignore
 */
export class ProjectorMessage extends ProjectableBaseModel {
    public id: number;
    public message: string;

    public constructor(input?: any) {
        super('core/projector-message', 'Message', input);
    }

    public getTitle(): string {
        return 'Projectormessage';
    }
}

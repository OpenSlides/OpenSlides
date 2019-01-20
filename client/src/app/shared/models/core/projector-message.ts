import { BaseModel } from '../base/base-model';

/**
 * Representation of a projector message.
 * @ignore
 */
export class ProjectorMessage extends BaseModel<ProjectorMessage> {
    public id: number;
    public message: string;

    public constructor(input?: any) {
        super('core/projector-message', 'Message', input);
    }

    public getTitle(): string {
        return 'Projectormessage';
    }
}

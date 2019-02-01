import { BaseModel } from '../base/base-model';

/**
 * Representation of a projector message.
 * @ignore
 */
export class ProjectorMessage extends BaseModel<ProjectorMessage> {
    public static COLLECTIONSTRING = 'core/projector-message';

    public id: number;
    public message: string;

    public constructor(input?: any) {
        super(ProjectorMessage.COLLECTIONSTRING, input);
    }
}

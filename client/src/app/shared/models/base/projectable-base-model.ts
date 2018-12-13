import { BaseModel } from './base-model';
import { Projectable } from './projectable';

export abstract class ProjectableBaseModel extends BaseModel<ProjectableBaseModel> implements Projectable {
    /**
     * A model which can be projected. This class give basic implementation for the projector.
     *
     * @param collectionString
     * @param verboseName
     * @param input
     */
    protected constructor(collectionString: string, verboseName: string, input?: any) {
        super(collectionString, verboseName, input);
    }

    /**
     * This is a Dummy, which should be changed if the projector gets implemented.
     */
    public project(): void {}

    /**
     * @returns the projector title.
     */
    public getProjectorTitle(): string {
        return this.getTitle();
    }
}

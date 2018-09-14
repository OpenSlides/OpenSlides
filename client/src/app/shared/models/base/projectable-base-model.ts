import { BaseModel } from './base-model';
import { Projectable } from './projectable';

export abstract class ProjectableBaseModel extends BaseModel implements Projectable {
    protected constructor(collectionString: string, input?: any) {
        super(collectionString, input);
    }

    /**
     * This is a Dummy, which should be changed if the projector gets implemented.
     */
    public project(): void {}

    public getProjectorTitle(): string {
        return this.getTitle();
    }
}

import { BaseViewModel } from '../../base/base-view-model';
import { ProjectionDefault } from 'app/shared/models/core/projection-default';

export interface ProjectionDefaultTitleInformation {
    display_name: string;
}

export class ViewProjectionDefault extends BaseViewModel<ProjectionDefault>
    implements ProjectionDefaultTitleInformation {
    public static COLLECTIONSTRING = ProjectionDefault.COLLECTIONSTRING;

    public get projectionDefault(): ProjectionDefault {
        return this._model;
    }

    public get id(): number {
        return this.projectionDefault.id;
    }

    public get name(): string {
        return this.projectionDefault.name;
    }

    public get display_name(): string {
        return this.projectionDefault.display_name;
    }

    public constructor(projectionDefault: ProjectionDefault) {
        super(ProjectionDefault.COLLECTIONSTRING, projectionDefault);
    }
}

import { BaseViewModel } from '../../base/base-view-model';
import { ProjectionDefault } from 'app/shared/models/core/projection-default';

export class ViewProjectionDefault extends BaseViewModel {
    public static COLLECTIONSTRING = ProjectionDefault.COLLECTIONSTRING;

    private _projectionDefault: ProjectionDefault;

    public get projectionDefault(): ProjectionDefault {
        return this._projectionDefault;
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

    /**
     * This is set by the repository
     */
    public getVerboseName: () => string;
    public getTitle: () => string;

    public constructor(projectionDefault: ProjectionDefault) {
        super(ProjectionDefault.COLLECTIONSTRING);
        this._projectionDefault = projectionDefault;
    }

    public getModel(): ProjectionDefault {
        return this.projectionDefault;
    }

    public updateDependencies(update: BaseViewModel): void {}
}

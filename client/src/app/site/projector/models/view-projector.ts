import { BaseViewModel } from '../../base/base-view-model';
import { Projector, ProjectorElements } from 'app/shared/models/core/projector';

export class ViewProjector extends BaseViewModel {
    private _projector: Projector;

    public get projector(): Projector {
        return this._projector ? this._projector : null;
    }

    public get id(): number {
        return this.projector ? this.projector.id : null;
    }

    public get name(): string {
        return this.projector ? this.projector.name : null;
    }

    public get elements(): ProjectorElements {
        return this.projector ? this.projector.elements : null;
    }

    public get non_stable_elements(): ProjectorElements {
        return this.projector ? this.projector.elements.filter(element => !element.stable) : null;
    }

    public get elements_preview(): ProjectorElements {
        return this.projector ? this.projector.elements_preview : null;
    }

    public get elements_history(): ProjectorElements[] {
        return this.projector ? this.projector.elements_history : null;
    }

    public get height(): number {
        return this.projector ? this.projector.height : null;
    }

    public get width(): number {
        return this.projector ? this.projector.width : null;
    }

    public get scale(): number {
        return this.projector ? this.projector.scale : null;
    }

    public get scroll(): number {
        return this.projector ? this.projector.scroll : null;
    }

    public constructor(projector?: Projector) {
        super();
        this._projector = projector;
    }

    public getTitle(): string {
        return this.name;
    }

    public updateValues(projector: Projector): void {
        console.log('Update projector TODO with vals:', projector);
    }
}

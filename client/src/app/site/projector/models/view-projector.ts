import { BaseViewModel } from '../../base/base-view-model';
import { Projector, ProjectorElements } from 'app/shared/models/core/projector';

export class ViewProjector extends BaseViewModel {
    public static COLLECTIONSTRING = Projector.COLLECTIONSTRING;

    private _projector: Projector;

    public get projector(): Projector {
        return this._projector;
    }

    public get id(): number {
        return this.projector.id;
    }

    public get name(): string {
        return this.projector.name;
    }

    public get elements(): ProjectorElements {
        return this.projector.elements;
    }

    public get non_stable_elements(): ProjectorElements {
        return this.projector.elements.filter(element => !element.stable);
    }

    public get elements_preview(): ProjectorElements {
        return this.projector.elements_preview;
    }

    public get elements_history(): ProjectorElements[] {
        return this.projector.elements_history;
    }

    public get height(): number {
        return this.projector.height;
    }

    public get width(): number {
        return this.projector.width;
    }

    public get scale(): number {
        return this.projector.scale;
    }

    public get scroll(): number {
        return this.projector.scroll;
    }

    public get reference_projector_id(): number {
        return this.projector.reference_projector_id;
    }

    public get background_color(): string {
        return this.projector.background_color;
    }

    public get header_background_color(): string {
        return this.projector.header_background_color;
    }

    public get header_font_color(): string {
        return this.projector.header_font_color;
    }

    public get header_h1_color(): string {
        return this.projector.header_h1_color;
    }

    public get show_header_footer(): boolean {
        return this.projector.show_header_footer;
    }

    public get show_title(): boolean {
        return this.projector.show_title;
    }

    public get show_logo(): boolean {
        return this.projector.show_logo;
    }

    /**
     * This is set by the repository
     */
    public getVerboseName;

    public constructor(projector?: Projector) {
        super(Projector.COLLECTIONSTRING);
        this._projector = projector;
    }

    public getTitle = () => {
        return this.name;
    };

    public updateDependencies(update: BaseViewModel): void {}
}

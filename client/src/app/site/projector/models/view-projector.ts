import { Projector, ProjectorElements } from 'app/shared/models/core/projector';
import { BaseViewModel } from '../../base/base-view-model';

export interface ProjectorTitleInformation {
    name: string;
}

export class ViewProjector extends BaseViewModel<Projector> {
    public static COLLECTIONSTRING = Projector.COLLECTIONSTRING;

    private _referenceProjector: ViewProjector;

    public get projector(): Projector {
        return this._model;
    }

    public get referenceProjector(): ViewProjector {
        if (!this.reference_projector_id || this.reference_projector_id === this.id) {
            return this;
        } else {
            return this._referenceProjector;
        }
    }

    public get name(): string {
        return this.projector.name;
    }

    public get projectiondefaults_id(): number[] {
        return this.projector.projectiondefaults_id;
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

    public get color(): string {
        return this.projector.color;
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

    public get chyron_background_color(): string {
        return this.projector.chyron_background_color;
    }

    public get chyron_font_color(): string {
        return this.projector.chyron_font_color;
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

    public constructor(projector: Projector) {
        super(Projector.COLLECTIONSTRING, projector);
    }
}

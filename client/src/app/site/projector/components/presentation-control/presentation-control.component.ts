import { Component, Input } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material';

import { TranslateService } from '@ngx-translate/core';

import { BaseViewComponent } from 'app/site/base/base-view';
import { ViewProjector } from '../../models/view-projector';
import { ProjectorElements, ProjectorElement } from 'app/shared/models/core/projector';
import { Mediafile } from 'app/shared/models/mediafiles/mediafile';
import { MediafileRepositoryService } from 'app/core/repositories/mediafiles/mediafile-repository.service';
import { ViewMediafile } from 'app/site/mediafiles/models/view-mediafile';
import { SlideManager } from 'app/slides/services/slide-manager.service';
import { ProjectorService } from 'app/core/core-services/projector.service';

/**
 * The presentation controls.
 */
@Component({
    selector: 'os-presentation-control',
    templateUrl: './presentation-control.component.html',
    styleUrls: ['./presentation-control.component.scss']
})
export class PresentationControlComponent extends BaseViewComponent {
    /**
     * The projector.
     */
    private _projector: ViewProjector;

    @Input()
    public set projector(projector: ViewProjector) {
        this._projector = projector;
        this.updateElements();
    }

    public get projector(): ViewProjector {
        return this._projector;
    }

    // All mediafile elements.
    public elements: ProjectorElements = [];

    public constructor(
        titleService: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        private mediafileRepo: MediafileRepositoryService,
        private slideManager: SlideManager,
        private projectorService: ProjectorService
    ) {
        super(titleService, translate, matSnackBar);
    }

    private updateElements(): void {
        this.elements = this.projector.elements.filter(element => {
            if (element.name !== Mediafile.COLLECTIONSTRING && !element.id) {
                return false;
            }
            const mediafile = this.mediafileRepo.getViewModel(element.id);
            return !!mediafile && mediafile.isProjectable();
        });
    }

    public getMediafile(element: ProjectorElement): ViewMediafile {
        return this.mediafileRepo.getViewModel(element.id);
    }

    public getPage(element: ProjectorElement): number {
        return element.page || 1;
    }

    public pdfForward(element: ProjectorElement): void {
        if (this.getPage(element) < this.getMediafile(element).pages) {
            this.pdfSetPage(element, this.getPage(element) + 1);
        }
    }

    public pdfBackward(element: ProjectorElement): void {
        if (this.getPage(element) > 1) {
            this.pdfSetPage(element, this.getPage(element) - 1);
        }
    }

    public pdfSetPage(element: ProjectorElement, page: number): void {
        const idElement = this.slideManager.getIdentifialbeProjectorElement(element);
        idElement.page = page;
        this.projectorService.updateElement(this.projector.projector, idElement).then(null, this.raiseError);
    }

    public pdfZoom(element: ProjectorElement, direction: 'in' | 'out' | 'reset'): void {}

    public pdfRotate(element: ProjectorElement): void {}

    public imageFullscreen(element: ProjectorElement): void {}

    public imageRotate(element: ProjectorElement): void {}
}

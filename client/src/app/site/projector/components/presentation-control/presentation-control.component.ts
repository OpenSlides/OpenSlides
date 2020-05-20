import { Component, Input } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { ProjectorService } from 'app/core/core-services/projector.service';
import { MediafileRepositoryService } from 'app/core/repositories/mediafiles/mediafile-repository.service';
import { Mediafile } from 'app/shared/models/mediafiles/mediafile';
import { BaseViewComponent } from 'app/site/base/base-view';
import { MediafileProjectorElement } from 'app/site/mediafiles/models/mediafile-projector-element';
import { ViewMediafile } from 'app/site/mediafiles/models/view-mediafile';
import { SlideManager } from 'app/slides/services/slide-manager.service';
import { ViewProjector } from '../../models/view-projector';

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
    public elements: MediafileProjectorElement[] = [];

    /**
     * Constructor
     *
     * @param titleService
     * @param translate
     * @param matSnackBar
     * @param mediafileRepo
     * @param slideManager
     * @param projectorService
     */
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

    /**
     * Updates incoming elements
     */
    private updateElements(): void {
        this.elements = this.projector.elements.filter(element => {
            if (element.name !== Mediafile.COLLECTIONSTRING || !element.id) {
                return false;
            }
            const mediafile = this.mediafileRepo.getViewModel(element.id);
            return !!mediafile && mediafile.isProjectable();
        });
    }

    public getMediafile(element: MediafileProjectorElement): ViewMediafile {
        return this.mediafileRepo.getViewModel(element.id);
    }

    /**
     * @returns the currently used page number (1 in case of unnumbered elements)
     */
    public getPage(element: MediafileProjectorElement): number {
        return element.page || 1;
    }

    /**
     * moves the projected forward by one page (if not already at end)
     *
     * @param element
     */
    public pdfForward(element: MediafileProjectorElement): void {
        if (this.getPage(element) < this.getMediafile(element).pages) {
            this.pdfSetPage(element, this.getPage(element) + 1);
        }
    }

    /**
     * moves the projected one page backwards (if not already at beginnning)
     *
     * @param element
     */
    public pdfBackward(element: MediafileProjectorElement): void {
        if (this.getPage(element) > 1) {
            this.pdfSetPage(element, this.getPage(element) - 1);
        }
    }

    /**
     * Moves the element to a specific given page. If the number given is greater
     * than the amount of element pages, it does nothing
     *
     * @param element
     * @param page
     */
    public pdfSetPage(element: MediafileProjectorElement, page: number): void {
        if (this.getMediafile(element).pages >= page) {
            element.page = page;
            this.updateElement(element);
        }
    }

    public zoom(element: MediafileProjectorElement, direction: 'in' | 'out' | 'reset'): void {
        if (direction === 'reset') {
            element.zoom = 0;
        } else if (direction === 'in') {
            element.zoom = (element.zoom || 0) + 1;
        } else if (direction === 'out') {
            element.zoom = (element.zoom || 0) - 1;
        }
        this.updateElement(element);
    }

    public fullscreen(element: MediafileProjectorElement): void {
        element.fullscreen = !element.fullscreen;
        this.updateElement(element);
    }

    private updateElement(element: MediafileProjectorElement): void {
        const idElement = this.slideManager.getIdentifiableProjectorElement(element);
        this.projectorService.updateElement(this.projector.projector, idElement).catch(this.raiseError);
    }
}

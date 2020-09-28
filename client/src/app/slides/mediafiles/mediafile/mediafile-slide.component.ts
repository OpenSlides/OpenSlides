import { Component } from '@angular/core';

import { MediafileProjectorElement } from 'app/site/mediafiles/models/mediafile-projector-element';
import { IMAGE_MIMETYPES, PDF_MIMETYPES } from 'app/site/mediafiles/models/view-mediafile';
import { BaseSlideComponentDirective } from 'app/slides/base-slide-component';
import { MediafileSlideData } from './mediafile-slide-data';

@Component({
    selector: 'os-mediafile-slide',
    templateUrl: './mediafile-slide.component.html',
    styleUrls: ['./mediafile-slide.component.scss']
})
export class MediafileSlideComponent extends BaseSlideComponentDirective<
    MediafileSlideData,
    MediafileProjectorElement
> {
    public get url(): string {
        return `${this.data.data.media_url_prefix}${this.data.data.path}`;
    }

    public get zoom(): number {
        return Math.pow(1.1, this.data.element.zoom || 0);
    }

    public get isImage(): boolean {
        return IMAGE_MIMETYPES.includes(this.data.data.mimetype);
    }

    public get isPdf(): boolean {
        return PDF_MIMETYPES.includes(this.data.data.mimetype);
    }

    public constructor() {
        super();
        (window as any).pdfWorkerSrc = '/assets/js/pdf.worker.min.js';
    }
}

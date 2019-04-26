import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PdfViewerModule } from 'ng2-pdf-viewer';

import { MediafileSlideComponent } from './mediafile-slide.component';
import { SharedModule } from 'app/shared/shared.module';
import { SLIDE } from 'app/slides/slide-token';

@NgModule({
    imports: [CommonModule, SharedModule, PdfViewerModule],
    declarations: [MediafileSlideComponent],
    providers: [{ provide: SLIDE, useValue: MediafileSlideComponent }],
    entryComponents: [MediafileSlideComponent]
})
export class MediafileSlideModule {}

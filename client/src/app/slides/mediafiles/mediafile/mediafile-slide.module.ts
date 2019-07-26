import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { PdfViewerModule } from 'ng2-pdf-viewer';

import { SharedModule } from 'app/shared/shared.module';
import { SLIDE } from 'app/slides/slide-token';
import { MediafileSlideComponent } from './mediafile-slide.component';

@NgModule({
    imports: [CommonModule, SharedModule, PdfViewerModule],
    declarations: [MediafileSlideComponent],
    providers: [{ provide: SLIDE, useValue: MediafileSlideComponent }],
    entryComponents: [MediafileSlideComponent]
})
export class MediafileSlideModule {}

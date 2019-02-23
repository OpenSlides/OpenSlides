import { NgModule } from '@angular/core';

import { makeSlideModule } from 'app/slides/base-slide-module';
import { MediafileSlideComponent } from './mediafile-slide.component';
import { PdfViewerModule } from 'ng2-pdf-viewer';


let moduleConfiguration = makeSlideModule(MediafileSlideComponent);

moduleConfiguration.imports.push(PdfViewerModule)

@NgModule(moduleConfiguration)
export class MediafileSlideModule {}

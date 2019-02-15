import { NgModule } from '@angular/core';

import { makeSlideModule } from 'app/slides/base-slide-module';
import { MediafileSlideComponent } from './mediafile-slide.component';

@NgModule(makeSlideModule(MediafileSlideComponent))
export class MediafileSlideModule {}

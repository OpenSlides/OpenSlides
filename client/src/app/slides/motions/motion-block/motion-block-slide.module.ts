import { NgModule } from '@angular/core';

import { makeSlideModule } from 'app/slides/base-slide-module';
import { MotionBlockSlideComponent } from './motion-block-slide.component';

@NgModule(makeSlideModule(MotionBlockSlideComponent))
export class MotionBlockSlideModule {}

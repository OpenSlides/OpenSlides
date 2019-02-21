import { NgModule } from '@angular/core';

import { MotionSlideComponent } from './motion-slide.component';
import { makeSlideModule } from 'app/slides/base-slide-module';

@NgModule(makeSlideModule(MotionSlideComponent))
export class MotionSlideModule {}

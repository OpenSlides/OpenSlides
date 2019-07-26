import { NgModule } from '@angular/core';

import { makeSlideModule } from 'app/slides/base-slide-module';
import { MotionSlideComponent } from './motion-slide.component';

@NgModule(makeSlideModule(MotionSlideComponent))
export class MotionSlideModule {}

import { NgModule } from '@angular/core';

import { MotionsMotionSlideComponent } from './motions-motion-slide.component';
import { makeSlideModule } from 'app/slides/base-slide-module';

@NgModule(makeSlideModule(MotionsMotionSlideComponent))
export class MotionsMotionSlideModule {}

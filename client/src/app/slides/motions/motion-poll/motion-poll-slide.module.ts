import { NgModule } from '@angular/core';

import { makeSlideModule } from 'app/slides/base-slide-module';
import { MotionPollSlideComponent } from './motion-poll-slide.component';

@NgModule(makeSlideModule(MotionPollSlideComponent))
export class MotionPollSlideModule {}

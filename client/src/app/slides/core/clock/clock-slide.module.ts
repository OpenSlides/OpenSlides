import { NgModule } from '@angular/core';

import { makeSlideModule } from 'app/slides/base-slide-module';
import { ClockSlideComponent } from './clock-slide.component';

@NgModule(makeSlideModule(ClockSlideComponent))
export class ClockSlideModule {}

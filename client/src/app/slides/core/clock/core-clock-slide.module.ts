import { NgModule } from '@angular/core';

import { makeSlideModule } from 'app/slides/base-slide-module';
import { CoreClockSlideComponent } from './core-clock-slide.component';

@NgModule(makeSlideModule(CoreClockSlideComponent))
export class CoreClockSlideModule {}

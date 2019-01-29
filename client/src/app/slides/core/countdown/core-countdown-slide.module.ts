import { NgModule } from '@angular/core';

import { makeSlideModule } from 'app/slides/base-slide-module';
import { CoreCountdownSlideComponent } from './core-countdown-slide.component';

@NgModule(makeSlideModule(CoreCountdownSlideComponent))
export class CoreCountdownSlideModule {}

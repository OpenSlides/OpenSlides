import { NgModule } from '@angular/core';

import { makeSlideModule } from 'app/slides/base-slide-module';
import { CountdownSlideComponent } from './countdown-slide.component';

@NgModule(makeSlideModule(CountdownSlideComponent))
export class CountdownSlideModule {}

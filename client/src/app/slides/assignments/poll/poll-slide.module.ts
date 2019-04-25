import { NgModule } from '@angular/core';

import { makeSlideModule } from 'app/slides/base-slide-module';
import { PollSlideComponent } from './poll-slide.component';

@NgModule(makeSlideModule(PollSlideComponent))
export class PollSlideModule {}

import { NgModule } from '@angular/core';

import { makeSlideModule } from 'app/slides/base-slide-module';
import { AssignmentPollSlideComponent } from './assignment-poll-slide.component';

@NgModule(makeSlideModule(AssignmentPollSlideComponent))
export class AssignmentPollSlideModule {}

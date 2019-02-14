import { NgModule } from '@angular/core';

import { makeSlideModule } from 'app/slides/base-slide-module';
import { AssignmentSlideComponent } from './assignment-slide.component';

@NgModule(makeSlideModule(AssignmentSlideComponent))
export class AssignmentSlideModule {}

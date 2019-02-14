import { NgModule } from '@angular/core';

import { makeSlideModule } from 'app/slides/base-slide-module';
import { ProjectorMessageSlideComponent } from './projector-message-slide.component';

@NgModule(makeSlideModule(ProjectorMessageSlideComponent))
export class ProjectorMessageSlideModule {}

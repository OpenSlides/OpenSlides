import { NgModule } from '@angular/core';

import { makeSlideModule } from 'app/slides/base-slide-module';
import { TopicSlideComponent } from './topic-slide.component';

@NgModule(makeSlideModule(TopicSlideComponent))
export class TopicSlideModule {}

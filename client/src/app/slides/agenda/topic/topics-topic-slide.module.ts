import { NgModule } from '@angular/core';

import { makeSlideModule } from 'app/slides/base-slide-module';
import { TopicsTopicSlideComponent } from './topics-topic-slide.component';

@NgModule(makeSlideModule(TopicsTopicSlideComponent))
export class TopicsTopicSlideModule {}

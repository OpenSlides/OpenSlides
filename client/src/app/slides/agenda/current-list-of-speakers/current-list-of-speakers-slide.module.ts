import { NgModule } from '@angular/core';

import { makeSlideModule } from 'app/slides/base-slide-module';
import { CurrentListOfSpeakersSlideComponent } from './current-list-of-speakers-slide.component';

@NgModule(makeSlideModule(CurrentListOfSpeakersSlideComponent))
export class CurrentListOfSpeakersSlideModule {}

import { NgModule } from '@angular/core';

import { makeSlideModule } from 'app/slides/base-slide-module';
import { CurrentListOfSpeakersOverlaySlideComponent } from './current-list-of-speakers-overlay-slide.component';

@NgModule(makeSlideModule(CurrentListOfSpeakersOverlaySlideComponent))
export class CurrentListOfSpeakersOverlaySlideModule {}

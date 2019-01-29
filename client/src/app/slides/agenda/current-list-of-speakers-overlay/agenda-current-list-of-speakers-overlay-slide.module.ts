import { NgModule } from '@angular/core';

import { makeSlideModule } from 'app/slides/base-slide-module';
import { AgendaCurrentListOfSpeakersOverlaySlideComponent } from './agenda-current-list-of-speakers-overlay-slide.component';

@NgModule(makeSlideModule(AgendaCurrentListOfSpeakersOverlaySlideComponent))
export class AgendaCurrentListOfSpeakersOverlaySlideModule {}

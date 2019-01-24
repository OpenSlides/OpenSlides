import { NgModule } from '@angular/core';

import { makeSlideModule } from 'app/slides/base-slide-module';
import { AgendaCurrentListOfSpeakersSlideComponent } from './agenda-current-list-of-speakers-slide.component';

@NgModule(makeSlideModule(AgendaCurrentListOfSpeakersSlideComponent))
export class AgendaCurrentListOfSpeakersSlideModule {}

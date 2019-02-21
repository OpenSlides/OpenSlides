import { NgModule } from '@angular/core';

import { makeSlideModule } from 'app/slides/base-slide-module';
import { ListOfSpeakersSlideComponent } from './list-of-speakers-slide.component';

@NgModule(makeSlideModule(ListOfSpeakersSlideComponent))
export class ListOfSpeakersSlideModule {}

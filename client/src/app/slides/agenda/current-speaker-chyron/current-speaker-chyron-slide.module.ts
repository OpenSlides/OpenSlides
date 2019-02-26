import { NgModule } from '@angular/core';

import { makeSlideModule } from 'app/slides/base-slide-module';
import { CurrentSpeakerChyronSlideComponent } from './current-speaker-chyron-slide.component';

@NgModule(makeSlideModule(CurrentSpeakerChyronSlideComponent))
export class CurrentSpeakerChyronSlideModule {}

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from 'app/shared/shared.module';
import { SlideToken } from 'app/slides/slide-token';
import { CurrentSpeakerChyronSlideComponent } from './current-speaker-chyron-slide.component';
@NgModule({
    imports: [CommonModule, SharedModule],
    declarations: [CurrentSpeakerChyronSlideComponent],
    providers: [{ provide: SlideToken.token, useValue: CurrentSpeakerChyronSlideComponent }]
})
export class CurrentSpeakerChyronSlideModule {}

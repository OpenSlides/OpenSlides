import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from 'app/shared/shared.module';
import { SLIDE } from 'app/slides/slide-token';
import { CommonListOfSpeakersSlideModule } from '../common/common-list-of-speakers-slide.module';
import { CurrentListOfSpeakersOverlaySlideComponent } from './current-list-of-speakers-overlay-slide.component';

@NgModule({
    imports: [CommonModule, SharedModule, CommonListOfSpeakersSlideModule],
    declarations: [CurrentListOfSpeakersOverlaySlideComponent],
    providers: [{ provide: SLIDE, useValue: CurrentListOfSpeakersOverlaySlideComponent }],
    entryComponents: [CurrentListOfSpeakersOverlaySlideComponent]
})
export class CurrentListOfSpeakersOverlaySlideModule {}

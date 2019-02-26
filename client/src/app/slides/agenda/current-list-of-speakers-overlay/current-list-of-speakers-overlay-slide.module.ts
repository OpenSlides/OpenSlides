import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CurrentListOfSpeakersOverlaySlideComponent } from './current-list-of-speakers-overlay-slide.component';
import { CommonListOfSpeakersSlideModule } from '../common/common-list-of-speakers-slide.module';
import { SharedModule } from 'app/shared/shared.module';
import { SLIDE } from 'app/slides/slide-token';

@NgModule({
    imports: [CommonModule, SharedModule, CommonListOfSpeakersSlideModule],
    declarations: [CurrentListOfSpeakersOverlaySlideComponent],
    providers: [{ provide: SLIDE, useValue: CurrentListOfSpeakersOverlaySlideComponent }],
    entryComponents: [CurrentListOfSpeakersOverlaySlideComponent]
})
export class CurrentListOfSpeakersOverlaySlideModule {}

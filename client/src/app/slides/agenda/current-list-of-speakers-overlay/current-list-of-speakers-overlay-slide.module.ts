import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from 'app/shared/shared.module';
import { SlideToken } from 'app/slides/slide-token';
import { CommonListOfSpeakersSlideModule } from '../common/common-list-of-speakers-slide.module';
import { CurrentListOfSpeakersOverlaySlideComponent } from './current-list-of-speakers-overlay-slide.component';

@NgModule({
    imports: [CommonModule, SharedModule, CommonListOfSpeakersSlideModule],
    declarations: [CurrentListOfSpeakersOverlaySlideComponent],
    providers: [{ provide: SlideToken.token, useValue: CurrentListOfSpeakersOverlaySlideComponent }]
})
export class CurrentListOfSpeakersOverlaySlideModule {}

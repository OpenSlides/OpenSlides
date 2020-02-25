import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from 'app/shared/shared.module';
import { CommonListOfSpeakersSlideComponent } from '../common/common-list-of-speakers-slide.component';
import { CommonListOfSpeakersSlideModule } from '../common/common-list-of-speakers-slide.module';
import { SLIDE } from '../../slide-token';

@NgModule({
    imports: [CommonModule, SharedModule, CommonListOfSpeakersSlideModule],
    providers: [{ provide: SLIDE, useValue: CommonListOfSpeakersSlideComponent }]
})
export class CurrentListOfSpeakersSlideModule {}

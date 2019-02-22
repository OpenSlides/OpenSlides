import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SLIDE } from '../../slide-token';
import { SharedModule } from 'app/shared/shared.module';
import { CommonListOfSpeakersSlideModule } from '../common/common-list-of-speakers-slide.module';
import { CommonListOfSpeakersSlideComponent } from '../common/common-list-of-speakers-slide.component';

@NgModule({
    imports: [CommonModule, SharedModule, CommonListOfSpeakersSlideModule],
    providers: [{ provide: SLIDE, useValue: CommonListOfSpeakersSlideComponent }]
})
export class CurrentListOfSpeakersSlideModule {}

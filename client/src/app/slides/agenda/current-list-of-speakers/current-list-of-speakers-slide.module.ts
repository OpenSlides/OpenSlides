import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from 'app/shared/shared.module';
import { CommonListOfSpeakersSlideComponent } from '../common/common-list-of-speakers-slide.component';
import { CommonListOfSpeakersSlideModule } from '../common/common-list-of-speakers-slide.module';
import { SlideToken } from '../../slide-token';

@NgModule({
    imports: [CommonModule, SharedModule, CommonListOfSpeakersSlideModule],
    providers: [{ provide: SlideToken.token, useValue: CommonListOfSpeakersSlideComponent }]
})
export class CurrentListOfSpeakersSlideModule {}

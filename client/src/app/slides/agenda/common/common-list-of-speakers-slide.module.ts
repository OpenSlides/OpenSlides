import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CommonListOfSpeakersSlideComponent } from './common-list-of-speakers-slide.component';
import { SharedModule } from '../../../shared/shared.module';

@NgModule({
    declarations: [CommonListOfSpeakersSlideComponent],
    entryComponents: [CommonListOfSpeakersSlideComponent],
    imports: [CommonModule, SharedModule],
    exports: [CommonListOfSpeakersSlideComponent]
})
export class CommonListOfSpeakersSlideModule {}

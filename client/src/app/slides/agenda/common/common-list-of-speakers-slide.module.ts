import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from 'app/shared/shared.module';
import { CommonListOfSpeakersSlideComponent } from './common-list-of-speakers-slide.component';

@NgModule({
    declarations: [CommonListOfSpeakersSlideComponent],
    imports: [CommonModule, SharedModule],
    exports: [CommonListOfSpeakersSlideComponent]
})
export class CommonListOfSpeakersSlideModule {}

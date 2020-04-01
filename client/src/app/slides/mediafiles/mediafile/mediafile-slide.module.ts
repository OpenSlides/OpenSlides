import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from 'app/shared/shared.module';
import { SlideToken } from 'app/slides/slide-token';
import { MediafileSlideComponent } from './mediafile-slide.component';

@NgModule({
    imports: [CommonModule, SharedModule],
    declarations: [MediafileSlideComponent],
    providers: [{ provide: SlideToken.token, useValue: MediafileSlideComponent }]
})
export class MediafileSlideModule {}

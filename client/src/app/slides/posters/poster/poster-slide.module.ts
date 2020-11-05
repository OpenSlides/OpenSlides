import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from 'app/shared/shared.module';
import { SlideToken } from 'app/slides/slide-token';
import { PosterSlideComponent } from './poster-slide.component';

@NgModule({
    imports: [CommonModule, SharedModule],
    declarations: [PosterSlideComponent],
    providers: [{ provide: SlideToken.token, useValue: PosterSlideComponent }]
})
export class PosterSlideModule {}

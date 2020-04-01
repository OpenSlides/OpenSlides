import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from 'app/shared/shared.module';
import { SlideToken } from 'app/slides/slide-token';
import { MotionSlideComponent } from './motion-slide.component';
@NgModule({
    imports: [CommonModule, SharedModule],
    declarations: [MotionSlideComponent],
    providers: [{ provide: SlideToken.token, useValue: MotionSlideComponent }]
})
export class MotionSlideModule {}

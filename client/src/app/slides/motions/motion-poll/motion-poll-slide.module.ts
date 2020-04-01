import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from 'app/shared/shared.module';
import { SlideToken } from 'app/slides/slide-token';
import { MotionPollSlideComponent } from './motion-poll-slide.component';
@NgModule({
    imports: [CommonModule, SharedModule],
    declarations: [MotionPollSlideComponent],
    providers: [{ provide: SlideToken.token, useValue: MotionPollSlideComponent }]
})
export class MotionPollSlideModule {}

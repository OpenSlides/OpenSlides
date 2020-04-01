import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from 'app/shared/shared.module';
import { SlideToken } from 'app/slides/slide-token';
import { MotionBlockSlideComponent } from './motion-block-slide.component';
@NgModule({
    imports: [CommonModule, SharedModule],
    declarations: [MotionBlockSlideComponent],
    providers: [{ provide: SlideToken.token, useValue: MotionBlockSlideComponent }]
})
export class MotionBlockSlideModule {}

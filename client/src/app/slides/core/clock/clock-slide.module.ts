import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from 'app/shared/shared.module';
import { SlideToken } from 'app/slides/slide-token';
import { ClockSlideComponent } from './clock-slide.component';
@NgModule({
    imports: [CommonModule, SharedModule],
    declarations: [ClockSlideComponent],
    providers: [{ provide: SlideToken.token, useValue: ClockSlideComponent }]
})
export class ClockSlideModule {}

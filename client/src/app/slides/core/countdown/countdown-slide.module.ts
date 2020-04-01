import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from 'app/shared/shared.module';
import { SlideToken } from 'app/slides/slide-token';
import { CountdownSlideComponent } from './countdown-slide.component';
@NgModule({
    imports: [CommonModule, SharedModule],
    declarations: [CountdownSlideComponent],
    providers: [{ provide: SlideToken.token, useValue: CountdownSlideComponent }]
})
export class CountdownSlideModule {}

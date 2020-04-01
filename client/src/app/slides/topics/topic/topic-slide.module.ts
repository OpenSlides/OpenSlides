import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from 'app/shared/shared.module';
import { SlideToken } from 'app/slides/slide-token';
import { TopicSlideComponent } from './topic-slide.component';

@NgModule({
    imports: [CommonModule, SharedModule],
    declarations: [TopicSlideComponent],
    providers: [{ provide: SlideToken.token, useValue: TopicSlideComponent }]
})
export class TopicSlideModule {}

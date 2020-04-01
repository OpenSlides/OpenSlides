import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from 'app/shared/shared.module';
import { SlideToken } from 'app/slides/slide-token';
import { ProjectorMessageSlideComponent } from './projector-message-slide.component';
@NgModule({
    imports: [CommonModule, SharedModule],
    declarations: [ProjectorMessageSlideComponent],
    providers: [{ provide: SlideToken.token, useValue: ProjectorMessageSlideComponent }]
})
export class ProjectorMessageSlideModule {}

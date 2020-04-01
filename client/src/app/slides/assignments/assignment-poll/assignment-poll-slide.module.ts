import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from 'app/shared/shared.module';
import { SlideToken } from 'app/slides/slide-token';
import { AssignmentPollSlideComponent } from './assignment-poll-slide.component';
@NgModule({
    imports: [CommonModule, SharedModule],
    declarations: [AssignmentPollSlideComponent],
    providers: [{ provide: SlideToken.token, useValue: AssignmentPollSlideComponent }]
})
export class AssignmentPollSlideModule {}

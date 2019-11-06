import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from 'app/shared/shared.module';
import { MotionPollDetailComponent } from './motion-poll-detail/motion-poll-detail.component';
import { MotionPollListComponent } from './motion-poll-list/motion-poll-list.component';
import { MotionPollRoutingModule } from './motion-poll-routing.module';

@NgModule({
    declarations: [MotionPollDetailComponent, MotionPollListComponent],
    imports: [CommonModule, SharedModule, MotionPollRoutingModule]
})
export class MotionPollModule {}

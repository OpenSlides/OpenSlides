import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from 'app/shared/shared.module';
import { MotionPollDetailComponent } from './motion-poll-detail/motion-poll-detail.component';
import { MotionPollListComponent } from './motion-poll-list/motion-poll-list.component';
import { MotionPollRoutingModule } from './motion-poll-routing.module';
import { MotionPollVoteComponent } from './motion-poll-vote/motion-poll-vote.component';
import { MotionPollComponent } from './motion-poll/motion-poll.component';

@NgModule({
    imports: [CommonModule, SharedModule, MotionPollRoutingModule],
    exports: [MotionPollComponent],
    declarations: [MotionPollComponent, MotionPollDetailComponent, MotionPollListComponent, MotionPollVoteComponent]
})
export class MotionPollModule {}

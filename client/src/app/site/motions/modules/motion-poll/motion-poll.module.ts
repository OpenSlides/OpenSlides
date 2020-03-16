import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from 'app/shared/shared.module';
import { PollsModule } from 'app/site/polls/polls.module';
import { MotionPollDetailComponent } from './motion-poll-detail/motion-poll-detail.component';
import { MotionPollRoutingModule } from './motion-poll-routing.module';
import { MotionPollVoteComponent } from './motion-poll-vote/motion-poll-vote.component';
import { MotionPollComponent } from './motion-poll/motion-poll.component';

@NgModule({
    imports: [CommonModule, SharedModule, MotionPollRoutingModule, PollsModule],
    exports: [MotionPollComponent],
    declarations: [MotionPollComponent, MotionPollDetailComponent, MotionPollVoteComponent]
})
export class MotionPollModule {}

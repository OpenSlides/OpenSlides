import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from 'app/shared/shared.module';
import { PollsModule } from 'app/site/polls/polls.module';
import { AssignmentPollDetailComponent } from './components/assignment-poll-detail/assignment-poll-detail.component';
import { AssignmentPollDialogComponent } from './components/assignment-poll-dialog/assignment-poll-dialog.component';
import { AssignmentPollRoutingModule } from './assignment-poll-routing.module';
import { AssignmentPollVoteComponent } from './components/assignment-poll-vote/assignment-poll-vote.component';
import { AssignmentPollComponent } from './components/assignment-poll/assignment-poll.component';

@NgModule({
    declarations: [
        AssignmentPollComponent,
        AssignmentPollDetailComponent,
        AssignmentPollVoteComponent,
        AssignmentPollDialogComponent
    ],
    exports: [AssignmentPollComponent, AssignmentPollVoteComponent],
    imports: [CommonModule, AssignmentPollRoutingModule, SharedModule, PollsModule]
})
export class AssignmentPollModule {}

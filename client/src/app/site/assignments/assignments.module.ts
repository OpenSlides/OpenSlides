import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { AssignmentDetailComponent } from './components/assignment-detail/assignment-detail.component';
import { AssignmentListComponent } from './components/assignment-list/assignment-list.component';
import { AssignmentPollDetailComponent } from './components/assignment-poll-detail/assignment-poll-detail.component';
import { AssignmentPollVoteComponent } from './components/assignment-poll-vote/assignment-poll-vote.component';
import { AssignmentPollComponent } from './components/assignment-poll/assignment-poll.component';
import { AssignmentsRoutingModule } from './assignments-routing.module';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
    imports: [CommonModule, AssignmentsRoutingModule, SharedModule],
    declarations: [
        AssignmentListComponent,
        AssignmentDetailComponent,
        AssignmentPollComponent,
        AssignmentPollDetailComponent,
        AssignmentPollVoteComponent
    ]
})
export class AssignmentsModule {}

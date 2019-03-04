import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { AssignmentDetailComponent } from './components/assignment-detail/assignment-detail.component';
import { AssignmentListComponent } from './assignment-list/assignment-list.component';
import { AssignmentsRoutingModule } from './assignments-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { AssignmentPollComponent } from './components/assignment-poll/assignment-poll.component';
import { AssignmentPollDialogComponent } from './components/assignment-poll/assignment-poll-dialog.component';

@NgModule({
    imports: [CommonModule, AssignmentsRoutingModule, SharedModule],
    declarations: [
        AssignmentListComponent,
        AssignmentDetailComponent,
        AssignmentPollComponent,
        AssignmentPollDialogComponent
    ],
    entryComponents: [AssignmentPollDialogComponent]
})
export class AssignmentsModule {}

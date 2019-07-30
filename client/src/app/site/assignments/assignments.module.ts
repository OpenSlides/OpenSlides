import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { AssignmentDetailComponent } from './components/assignment-detail/assignment-detail.component';
import { AssignmentListComponent } from './components/assignment-list/assignment-list.component';
import { AssignmentPollDialogComponent } from './components/assignment-poll-dialog/assignment-poll-dialog.component';
import { AssignmentPollComponent } from './components/assignment-poll/assignment-poll.component';
import { AssignmentsRoutingModule } from './assignments-routing.module';
import { SharedModule } from '../../shared/shared.module';

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

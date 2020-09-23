import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { AssignmentDetailComponent } from './components/assignment-detail/assignment-detail.component';
import { AssignmentListComponent } from './components/assignment-list/assignment-list.component';
import { AssignmentPollModule } from './modules/assignment-poll/assignment-poll.module';
import { AssignmentsRoutingModule } from './assignments-routing.module';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
    imports: [CommonModule, AssignmentsRoutingModule, AssignmentPollModule, SharedModule],
    declarations: [AssignmentDetailComponent, AssignmentListComponent]
})
export class AssignmentsModule {}

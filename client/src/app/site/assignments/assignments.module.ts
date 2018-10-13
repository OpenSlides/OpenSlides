import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AssignmentsRoutingModule } from './assignments-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { AssignmentListComponent } from './assignment-list/assignment-list.component';

@NgModule({
    imports: [CommonModule, AssignmentsRoutingModule, SharedModule],
    declarations: [AssignmentListComponent]
})
export class AssignmentsModule {}

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from 'app/shared/shared.module';
import { MotionWorkflowRoutingModule } from './motion-workflow-routing.module';
import { WorkflowDetailComponent } from './components/workflow-detail/workflow-detail.component';
import { WorkflowListComponent } from './components/workflow-list/workflow-list.component';

@NgModule({
    declarations: [WorkflowListComponent, WorkflowDetailComponent],
    imports: [CommonModule, MotionWorkflowRoutingModule, SharedModule]
})
export class MotionWorkflowModule {}

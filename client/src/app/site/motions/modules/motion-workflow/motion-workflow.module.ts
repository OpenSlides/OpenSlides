import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MotionWorkflowRoutingModule } from './motion-workflow-routing.module';
import { SharedModule } from 'app/shared/shared.module';
import { WorkflowListComponent } from './components/workflow-list/workflow-list.component';
import { WorkflowDetailComponent } from './components/workflow-detail/workflow-detail.component';

@NgModule({
    declarations: [WorkflowListComponent, WorkflowDetailComponent],
    imports: [CommonModule, MotionWorkflowRoutingModule, SharedModule]
})
export class MotionWorkflowModule {}

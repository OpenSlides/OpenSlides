import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { WorkflowListComponent } from './components/workflow-list/workflow-list.component';
import { WorkflowDetailComponent } from './components/workflow-detail/workflow-detail.component';

const routes: Routes = [
    { path: '', component: WorkflowListComponent, pathMatch: 'full' },
    { path: ':id', component: WorkflowDetailComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MotionWorkflowRoutingModule {}

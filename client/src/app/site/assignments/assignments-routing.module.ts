import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { Permission } from 'app/core/core-services/operator.service';
import { AssignmentDetailComponent } from './components/assignment-detail/assignment-detail.component';
import { AssignmentListComponent } from './components/assignment-list/assignment-list.component';
import { AssignmentPollDetailComponent } from './components/assignment-poll-detail/assignment-poll-detail.component';

const routes: Routes = [
    { path: '', component: AssignmentListComponent, pathMatch: 'full' },
    { path: 'new', component: AssignmentDetailComponent, data: { basePerm: Permission.assignmentsCanManage } },
    { path: ':id', component: AssignmentDetailComponent, data: { basePerm: Permission.assignmentsCanSee } },
    { path: 'polls', children: [{ path: ':id', component: AssignmentPollDetailComponent }] }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AssignmentsRoutingModule {}

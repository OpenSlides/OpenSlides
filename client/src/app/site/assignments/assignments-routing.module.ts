import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { Permission } from 'app/core/core-services/operator.service';
import { AssignmentDetailComponent } from './components/assignment-detail/assignment-detail.component';
import { AssignmentListComponent } from './components/assignment-list/assignment-list.component';

const routes: Routes = [
    { path: '', component: AssignmentListComponent, pathMatch: 'full' },
    { path: 'new', component: AssignmentDetailComponent, data: { basePerm: Permission.assignmentsCanManage } },
    { path: ':id', component: AssignmentDetailComponent, data: { basePerm: Permission.assignmentsCanSee } },
    {
        path: 'polls',
        loadChildren: () => import('./modules/assignment-poll/assignment-poll.module').then(m => m.AssignmentPollModule)
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AssignmentsRoutingModule {}

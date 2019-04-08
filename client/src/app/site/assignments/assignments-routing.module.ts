import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AssignmentDetailComponent } from './components/assignment-detail/assignment-detail.component';
import { AssignmentListComponent } from './assignment-list/assignment-list.component';

const routes: Routes = [
    { path: '', component: AssignmentListComponent, pathMatch: 'full' },
    { path: 'new', component: AssignmentDetailComponent },
    { path: ':id', component: AssignmentDetailComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AssignmentsRoutingModule {}

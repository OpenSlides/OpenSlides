import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AssignmentPollDetailComponent } from './components/assignment-poll-detail/assignment-poll-detail.component';

const routes: Routes = [{ path: ':id', component: AssignmentPollDetailComponent }];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AssignmentPollRoutingModule {}

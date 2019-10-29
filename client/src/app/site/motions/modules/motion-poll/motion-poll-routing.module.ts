import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MotionPollDetailComponent } from './motion-poll-detail/motion-poll-detail.component';
import { MotionPollListComponent } from './motion-poll-list/motion-poll-list.component';

const routes: Routes = [
    { path: '', component: MotionPollListComponent, pathMatch: 'full' },
    { path: 'new', component: MotionPollDetailComponent },
    { path: ':id', component: MotionPollDetailComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MotionPollRoutingModule {}

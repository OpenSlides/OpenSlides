import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MotionPollDetailComponent } from './motion-poll-detail/motion-poll-detail.component';

const routes: Routes = [
    { path: 'new', component: MotionPollDetailComponent },
    { path: ':id', component: MotionPollDetailComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MotionPollRoutingModule {}

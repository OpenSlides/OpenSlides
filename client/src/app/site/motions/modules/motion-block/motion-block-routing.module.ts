import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';

import { MotionBlockDetailComponent } from './components/motion-block-detail/motion-block-detail.component';
import { MotionBlockListComponent } from './components/motion-block-list/motion-block-list.component';

const routes: Route[] = [
    { path: '', component: MotionBlockListComponent, pathMatch: 'full' },
    { path: ':id', component: MotionBlockDetailComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MotionBlockRoutingModule {}
